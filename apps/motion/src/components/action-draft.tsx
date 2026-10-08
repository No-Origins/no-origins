"use client";

import * as React from "react";
import { Button } from "@no-origins/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Separator } from "@no-origins/ui/components/separator";
import { Text } from "@no-origins/ui/components/text";
import { AGENT_ACTIONS, agentAction, checkActionValues, type AgentAction } from "@no-origins/ui/lib/agent-actions";
import { cn } from "@no-origins/ui/lib/utils";

import {
  createAction, loadActions, publishAction, restoreAction, saveAction,
  type ActionsMay, type ActionVersion, type Outcome, type PublishStep, type SavedAction,
} from "@/app/actions";
import { actionStageValues, actionValuesOf } from "@/content/agent-actions";
import type { Family } from "@/content/families";
import { useStudio } from "@/components/studio-context";
import { JigCard } from "@/components/studio-jigs";

/**
 * An action's draft (Motion.md M24, his: *"now I can adjust the bounce play it … once I like it I should be able to
 * publish it"*): its values are the studio's, on its jigs, and **kept in the database** where the studio can — loaded
 * when its bench opens (made there the first time, from the values on the jigs), saved `SAVE_AFTER` ms after the last
 * change on the `rev` it was loaded at, and published as versions, `major`.`minor` (Orbit.md C19): Publish makes the
 * latest's next minor, the versions' dialog the next major, and going back to a version makes it the one pages play and
 * the draft its values. Another device's save first stops the saving until he loads it. With no keys, or signed out,
 * the values are the browser's, as every family's are. **An account that may not save** (`motion.open` alone, Access.md
 * A4) is `trying`: the action as it is published, every control its to move, nothing saved and nothing made (Orbit.md
 * C24's way).
 */
export type SaveStatus = "loading" | "saved" | "unsaved" | "saving" | "conflict" | "offline" | "signed-out" | "trying" | "error";

type Draft = {
  action: AgentAction;
  status: SaveStatus;
  /** Why the last thing asked of the database did not happen, in words. */
  message: string | null;
  /** Newest first. */
  versions: ActionVersion[];
  currentId: string | null;
  /** Whether the draft is the version pages play: there is nothing new to publish. */
  published: boolean;
  /** What this session may do (Access.md A3); null until loaded. */
  may: ActionsMay | null;
  publish: (step: PublishStep) => Promise<boolean>;
  restore: (versionId: string) => Promise<boolean>;
  reload: () => Promise<void>;
};

const DraftContext = React.createContext<Draft | null>(null);

/** The draft of the action on the bench; null off it. */
export const useActionDraft = () => React.useContext(DraftContext);

/** How long after the last change a draft is saved, ms: once a drag is over, not at every step of it. */
const SAVE_AFTER = 500;

/** What the database has of the action: its item, the `rev` it was loaded at, and the values it holds, as JSON. */
type Kept = { id: string; rev: number; json: string };

export function ActionDraftProvider({ family, children }: { family: Family; children: React.ReactNode }) {
  const studio = useStudio();
  const action = agentAction(family.action ?? "")!;
  // The draft as it stands on the jigs, whole and checked, as it would be saved.
  const values = studio.values(family);
  const json = React.useMemo(() => JSON.stringify(checkActionValues(action, actionValuesOf(action, values))), [action, values]);

  const [base, setBase] = React.useState<SaveStatus>("loading");
  const [message, setMessage] = React.useState<string | null>(null);
  const [savedJson, setSavedJson] = React.useState<string | null>(null);
  const [versions, setVersions] = React.useState<ActionVersion[]>([]);
  const [current, setCurrent] = React.useState<{ id: string | null; json: string | null }>({ id: null, json: null });
  const [may, setMay] = React.useState<ActionsMay | null>(null);
  // What the saver works from: refs, so a save in flight reads the newest values, not the render's.
  const kept = React.useRef<Kept | null>(null);
  const latest = React.useRef(json);
  const halted = React.useRef(false);
  const saving = React.useRef<Promise<boolean> | null>(null);
  const loading = React.useRef<Promise<void> | null>(null);
  const studioRef = React.useRef(studio);
  React.useLayoutEffect(() => {
    latest.current = json;
    studioRef.current = studio;
  });

  const failed = React.useCallback((outcome: Extract<Outcome<unknown>, { ok: false }>) => {
    setMessage(outcome.message);
    if (outcome.reason === "offline") return setBase("offline");
    if (outcome.reason === "signed-out") return setBase("signed-out");
    if (outcome.reason === "conflict") {
      halted.current = true;
      return setBase("conflict");
    }
    setBase("error");
  }, []);

  /** The action as the database has it, on the jigs. */
  const apply = React.useCallback((saved: SavedAction) => {
    const held = JSON.stringify(saved.values);
    kept.current = { id: saved.id, rev: saved.rev, json: held };
    halted.current = false;
    setSavedJson(held);
    setVersions(saved.versions);
    setCurrent({ id: saved.currentId, json: saved.current ? JSON.stringify(saved.current) : null });
    studioRef.current.replaceValues(family, actionStageValues(saved.values));
    setBase("saved");
    setMessage(null);
  }, [family]);

  /** The action as it is published, on the jigs, to try: nothing kept, so nothing is ever saved or made. */
  const tryOut = React.useCallback((published: SavedAction | undefined) => {
    kept.current = null;
    setSavedJson(null);
    setVersions(published?.versions ?? []);
    setCurrent({ id: published?.currentId ?? null, json: published?.current ? JSON.stringify(published.current) : null });
    if (published) studioRef.current.replaceValues(family, actionStageValues(published.values));
    setBase("trying");
    setMessage(null);
  }, [family]);

  const load = React.useCallback((): Promise<void> => {
    if (loading.current) return loading.current;
    const run = async () => {
      const outcome = await loadActions();
      if (!outcome.ok) return failed(outcome);
      setMay(outcome.value.may);
      const found = outcome.value.actions.find((a) => a.action === action.id);
      if (!outcome.value.may.save) return tryOut(found);
      if (found) return apply(found);
      // The first time: made in the database from the values on the jigs.
      const made = await createAction(action.id, JSON.parse(latest.current));
      if (!made.ok) return failed(made);
      apply(made.value);
    };
    loading.current = run().finally(() => {
      loading.current = null;
    });
    return loading.current;
  }, [action.id, apply, failed, tryOut]);

  React.useEffect(() => {
    void load();
  }, [load]);

  /** Save the values on the jigs if they moved; one pass at a time. True when all is saved. */
  const flush = React.useCallback((): Promise<boolean> => {
    if (saving.current) return saving.current;
    const run = async (): Promise<boolean> => {
      const was = kept.current;
      if (!was || halted.current) return false;
      const sending = latest.current;
      if (sending === was.json) return true;
      setBase("saving");
      const outcome = await saveAction(was.id, action.id, JSON.parse(sending), was.rev);
      if (!outcome.ok) {
        failed(outcome);
        return false;
      }
      kept.current = { ...was, rev: outcome.value.rev, json: sending };
      setSavedJson(sending);
      if (latest.current !== sending) return run();
      setBase("saved");
      setMessage(null);
      return true;
    };
    saving.current = run().finally(() => {
      saving.current = null;
    });
    return saving.current;
  }, [action.id, failed]);

  // A change on the jigs: saved once it has stood still a moment.
  React.useEffect(() => {
    if (savedJson === null || json === savedJson) return;
    const timer = setTimeout(() => void flush(), SAVE_AFTER);
    return () => clearTimeout(timer);
  }, [json, savedJson, flush]);

  const publish = React.useCallback(async (step: PublishStep) => {
    if (!(await flush())) return false;
    const was = kept.current;
    if (!was) return false;
    setBase("saving");
    const outcome = await publishAction(was.id, step, was.rev);
    if (!outcome.ok) {
      failed(outcome);
      return false;
    }
    apply(outcome.value);
    return true;
  }, [flush, failed, apply]);

  const restore = React.useCallback(async (versionId: string) => {
    if (!(await flush())) return false;
    const was = kept.current;
    if (!was) return false;
    const outcome = await restoreAction(was.id, versionId, was.rev);
    if (!outcome.ok) {
      failed(outcome);
      return false;
    }
    apply(outcome.value);
    return true;
  }, [flush, failed, apply]);

  const reload = React.useCallback(async () => {
    halted.current = false;
    await load();
  }, [load]);

  // Moved on the jigs since the database last had it, and not yet sent: unsaved.
  const status: SaveStatus = base === "saved" && savedJson !== null && json !== savedJson ? "unsaved" : base;
  const draft = React.useMemo<Draft>(() => ({
    action,
    status,
    message,
    versions,
    currentId: current.id,
    published: current.json !== null && current.json === json,
    may,
    publish,
    restore,
    reload,
  }), [action, status, message, versions, current, json, may, publish, restore, reload]);
  return <DraftContext.Provider value={draft}>{children}</DraftContext.Provider>;
}

const STATUS: Record<SaveStatus, string> = {
  loading: "Loading",
  saved: "Saved",
  unsaved: "Unsaved",
  saving: "Saving",
  conflict: "Changed elsewhere",
  offline: "In this browser",
  "signed-out": "Signed out",
  trying: "Trying",
  error: "Not saved",
};

const versionName = (v: Pick<ActionVersion, "major" | "minor">) => `${v.major}.${v.minor}`;

/** The versions a publish would make next: the latest's next minor, and the next major (C19). The first is 1.0 either way. */
function nextVersions(versions: readonly ActionVersion[]) {
  const top = versions[0];
  return top ? { minor: versionName({ major: top.major, minor: top.minor + 1 }), major: versionName({ major: top.major + 1, minor: 0 }) } : { minor: "1.0", major: "1.0" };
}

/**
 * The action's card, first in its jigs (M24): what it is, the version pages play and whether the draft has moved since,
 * how it is kept, Publish (the next minor) and its versions — going back to one, or publishing the next major.
 */
export function ActionCard() {
  const draft = useActionDraft();
  const [busy, setBusy] = React.useState(false);
  if (!draft) return null;
  const { action, status, versions } = draft;
  const shown = versions.find((v) => v.id === draft.currentId);
  const next = nextVersions(versions);
  const kept = status !== "loading" && status !== "offline" && status !== "signed-out" && status !== "conflict" && status !== "trying";
  const mayPublish = draft.may?.publish ?? false;
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const state = status === "trying"
    ? shown ? `Version ${versionName(shown)}, as published` : "Not published yet"
    : !kept ? null : shown ? `Version ${versionName(shown)}${draft.published ? "" : ", changed since"}` : "Not published yet";
  return <JigCard title={action.label} action={<Text role="caption" className="shrink-0" data-save-status={status}>{STATUS[status]}</Text>}>
    <Text role="caption">{action.touches}</Text>
    {state ? <Text role="body" data-action-version={shown ? versionName(shown) : ""}>{state}</Text> : null}
    {draft.message ? <Text role="caption">{draft.message}</Text> : null}
    {status === "trying" ? (
      <Text role="caption" data-trying="">Your roles open the studio to try every control. Nothing you change is saved.</Text>
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        {status === "conflict" ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(draft.reload)}>Load</Button>
        ) : (
          <Button size="sm" disabled={!kept || busy || draft.published || !mayPublish} onClick={() => void run(() => draft.publish("minor"))}>Publish {next.minor}</Button>
        )}
        <Versions disabled={!kept || busy} mayPublish={mayPublish} run={run} />
      </div>
    )}
    {kept && !mayPublish ? <Text role="caption">Your changes are saved; publishing needs motion.version.publish.</Text> : null}
  </JigCard>;
}

/** Every version of the action, newest first: the one pages play, going back to another, and the next major. */
function Versions({ disabled, mayPublish, run }: { disabled: boolean; mayPublish: boolean; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const draft = useActionDraft()!;
  const [open, setOpen] = React.useState(false);
  const next = nextVersions(draft.versions);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="outline" disabled={disabled}>Versions</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{draft.action.label}&apos;s versions</DialogTitle>
        <DialogDescription>A version never changes. Going back to one makes it the one pages play, and the draft its values.</DialogDescription>
      </DialogHeader>
      {draft.versions.length ? <div className="flex flex-col">
        {draft.versions.map((v, i) => <React.Fragment key={v.id}>
          {i ? <Separator /> : null}
          <div className="flex min-h-11 items-center justify-between gap-3 py-1">
            <div className="flex min-w-0 flex-col">
              <Text role="label">{versionName(v)}</Text>
              <Text role="caption">{new Date(v.publishedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Text>
            </div>
            {v.id === draft.currentId ? <Text role="caption">Pages play this</Text>
              : <Button size="sm" variant="outline" disabled={!mayPublish} onClick={() => void run(async () => { if (await draft.restore(v.id)) setOpen(false); })}>Go back</Button>}
          </div>
        </React.Fragment>)}
      </div> : <Text role="body">Not published yet. Publish makes 1.0.</Text>}
      {draft.versions.length ? <DialogFooter>
        <Button disabled={!mayPublish} onClick={() => void run(async () => { if (await draft.publish("major")) setOpen(false); })}>Publish {next.major}</Button>
      </DialogFooter> : null}
    </DialogContent>
  </Dialog>;
}

/** The head's select of the action on the bench (M24, his: "One agent page with a picker"). */
export function ActionSelect({ value, onChange, className }: { value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label="Action" className={cn("w-full min-w-0", className)}><SelectValue /></SelectTrigger>
      <SelectContent>
        {AGENT_ACTIONS.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
