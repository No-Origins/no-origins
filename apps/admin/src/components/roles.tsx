"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@no-origins/ui/components/alert-dialog";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@no-origins/ui/components/input-group";
import { Label } from "@no-origins/ui/components/label";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

import { createRole, deleteRole, makeDefault, saveRole } from "@/app/access/actions";
import { AdminPages, band, ColumnNames, NoteBox, RecordBox, useRefuse, wideOnly, type AdminItem } from "@/components/admin-pages";
import { Confirm, useChange } from "@/components/outcome";

export type RoleRow = {
  id: string;
  name: string;
  sentence: string;
  builtIn: "owner" | "member" | null;
  isDefault: boolean;
  permissions: string[];
  holders: number;
};

export type CatalogueEntry = { name: string; app: string; sentence: string };

// Role · permissions · held by.
const ROLE_COLS = "@min-[600px]:grid-cols-[minmax(0,1fr)_9rem_7rem]";
// The name, what it is for, and the change: on one row from 600px.
const FORM_COLS = "@min-[600px]:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]";
// Ticked · the permission · what it allows.
const PERM_COLS = "@min-[600px]:grid-cols-[auto_14rem_minmax(0,1fr)]";

// ── /roles ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Roles (Access.md A4, A7): every role a record on the field, each a link to its own page, and a new one. */
export function RolesView({ roles, total, mayManage }: { roles: RoleRow[]; total: number; mayManage: boolean }) {
  const items = React.useMemo<AdminItem[]>(() => [
    { id: "columns", repeat: true, span: wideOnly(), render: () => <ColumnNames className={ROLE_COLS} names={["Role", "Permissions", "Held by"]} /> },
    ...roles.map((role): AdminItem => ({ id: role.id, span: band(1, 2, 2), render: () => <RoleLink role={role} total={total} /> })),
    ...(mayManage ? [{ id: "new-role", span: band(1, 2, 3), render: () => <NewRole /> }] : []),
  ], [roles, total, mayManage]);
  return <AdminPages title="Roles" line="A role is a set of permissions you make here. Owner and Member are built in; Member is what a sign-up gets." items={items} />;
}

function RoleLink({ role, total }: { role: RoleRow; total: number }) {
  const count = role.builtIn === "owner" ? `all ${total}` : String(role.permissions.length);
  return (
    <Link href={`/roles/${role.id}`} className="group block size-full rounded-lg outline-none">
      <RecordBox className={ROLE_COLS} interactive>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <Text role="body" as="span" className="truncate font-medium">{role.name}</Text>
            {role.builtIn ? <Badge variant="secondary">Built in</Badge> : null}
            {role.isDefault ? <Badge variant="outline">Default</Badge> : null}
          </div>
          {role.sentence ? <Text role="caption" as="span" className="truncate">{role.sentence}</Text> : null}
        </div>
        <Text role="caption" as="span">{count}<span className="@min-[600px]:hidden"> permissions</span></Text>
        <Text role="caption" as="span"><span className="@min-[600px]:hidden">Held by </span>{role.holders}</Text>
      </RecordBox>
    </Link>
  );
}

/** A new role: a name and a sentence; its permissions are ticked on its own page, where making it takes you. */
function NewRole() {
  const router = useRouter();
  const { pending, run } = useChange();
  const [name, setName] = React.useState("");
  const [sentence, setSentence] = React.useState("");
  return (
    <form
      className="size-full"
      onSubmit={(event) => {
        event.preventDefault();
        run(async () => {
          const done = await createRole(name, sentence);
          if (done.ok && done.id) router.push(`/roles/${done.id}`);
          return done;
        });
      }}
    >
      <RecordBox className={FORM_COLS}>
        <InputGroup>
          <InputGroupAddon><InputGroupText>New role</InputGroupText></InputGroupAddon>
          <InputGroupInput aria-label="The new role's name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Friend" required />
        </InputGroup>
        <InputGroup>
          <InputGroupAddon><InputGroupText>For</InputGroupText></InputGroupAddon>
          <InputGroupInput aria-label="What it is for" value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="Family who may see the house" />
        </InputGroup>
        <Button type="submit" disabled={pending || !name.trim()}>Make the role</Button>
      </RecordBox>
    </form>
  );
}

// ── /roles/<id> ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * What the role's page holds until Save (Access.md A7, his, 2026-10-07: "select and then click on save so that we can
 * push all the changes together"): the name, the sentence and the ticks. Its boxes are placed on the field one by one,
 * so they read it from here rather than through props — a tick redraws the boxes that show it, never the layout.
 */
type Draft = {
  name: string;
  sentence: string;
  ticked: ReadonlySet<string>;
  held: ReadonlySet<string>;
  editable: boolean;
  pending: boolean;
  changes: number;
  done: boolean;
  setName: (name: string) => void;
  setSentence: (sentence: string) => void;
  tick: (permission: string, on: boolean) => void;
  discard: () => void;
  save: (refuse: (message: string | null) => void) => void;
};

const DraftContext = React.createContext<Draft | null>(null);

function useDraft(): Draft {
  const draft = React.useContext(DraftContext);
  if (!draft) throw new Error("A role's box is drawn outside its RoleView.");
  return draft;
}

function useRoleDraft(role: RoleRow, catalogue: CatalogueEntry[], editable: boolean): Draft {
  const held = React.useMemo(() => new Set(role.permissions), [role.permissions]);
  // When the role itself changes — a save landing, a change made elsewhere — the draft starts again from it.
  const saved = [role.name, role.sentence, ...[...role.permissions].sort()].join("\n");
  const [base, setBase] = React.useState(saved);
  const [name, setName] = React.useState(role.name);
  const [sentence, setSentence] = React.useState(role.sentence);
  const [ticked, setTicked] = React.useState<ReadonlySet<string>>(() => new Set(role.permissions));
  const [done, setDone] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (base !== saved) {
    setBase(saved);
    setName(role.name);
    setSentence(role.sentence);
    setTicked(new Set(role.permissions));
  }
  const changes =
    catalogue.filter((p) => ticked.has(p.name) !== held.has(p.name)).length +
    (name.trim() !== role.name ? 1 : 0) +
    (sentence.trim() !== role.sentence ? 1 : 0);
  return {
    name, sentence, ticked, held, editable, pending, changes, done,
    setName: (next) => {
      setDone(false);
      setName(next);
    },
    setSentence: (next) => {
      setDone(false);
      setSentence(next);
    },
    tick: (permission, on) => {
      setDone(false);
      setTicked((was) => new Set([...was].filter((p) => p !== permission).concat(on ? [permission] : [])));
    },
    discard: () => {
      setName(role.name);
      setSentence(role.sentence);
      setTicked(new Set(role.permissions));
    },
    // One transaction (`noo_save_role`): a refusal leaves the role as it was, and the draft as it is to try again.
    save: (refuse) => {
      refuse(null);
      start(async () => {
        const permissions = catalogue.filter((p) => ticked.has(p.name)).map((p) => p.name);
        const result = await saveRole(role.id, { name, sentence, permissions });
        if (result.ok) setDone(true);
        else refuse(result.message);
      });
    },
  };
}

/**
 * One role (Access.md A4, A7): its name and sentence with Discard and Save, the default and deleting it, then its
 * permissions by app, one record each with its sentence. Nothing is written as it is ticked; a changed record is tinted
 * and Save sends everything together. The name's row repeats on every page the role spills onto, so Save is always in
 * reach. The Owner holds everything and changes nothing here; a built-in role is never deleted. What the signed-in
 * person may not grant, the database refuses, and the refusal is shown under the name.
 */
export function RoleView({ role, catalogue, mayManage, line }: { role: RoleRow; catalogue: CatalogueEntry[]; mayManage: boolean; line: string }) {
  const owner = role.builtIn === "owner";
  const editable = mayManage && !owner;
  const draft = useRoleDraft(role, catalogue, editable);
  const items = React.useMemo<AdminItem[]>(() => {
    const apps = [...new Set(catalogue.map((p) => p.app))];
    // Stacked on six columns: two fields, and Discard and Save where it may be changed.
    const out: AdminItem[] = [{ id: "about", repeat: true, span: band(1, 2, editable ? 3 : 2), render: () => <RoleForm /> }];
    // The default is neither moved to itself nor deleted, so the default role has no changes here.
    if (editable && !role.isDefault) {
      out.push({ id: "changes", span: band(1), render: () => <RoleChanges role={role} /> });
    }
    if (owner) {
      out.push({ id: "owner", span: band(1, 2, 2), render: () => <NoteBox>The Owner holds every permission, those added later included, and is never given or taken here.</NoteBox> });
      return out;
    }
    for (const app of apps) {
      const names = catalogue.filter((p) => p.app === app).map((p) => p.name);
      out.push({ id: `app-${app}`, span: band(1), render: () => <AppName app={app} names={names} /> });
      for (const p of catalogue.filter((c) => c.app === app)) {
        out.push({ id: p.name, span: band(1, 2, 2), render: () => <PermissionBox permission={p} /> });
      }
    }
    return out;
  }, [role, catalogue, owner, editable]);
  return (
    <DraftContext.Provider value={draft}>
      <AdminPages title={role.name} line={line} back={{ href: "/roles", label: "Roles" }} items={items} />
      <LeaveGuard roleName={role.name} changes={draft.changes} />
    </DraftContext.Provider>
  );
}

function RoleForm() {
  const draft = useDraft();
  const refuse = useRefuse();
  const status = draft.pending
    ? "Saving…"
    : draft.changes
      ? `${draft.changes} ${draft.changes === 1 ? "change" : "changes"} unsaved`
      : draft.done
        ? "Saved"
        : "";
  return (
    <form
      className="size-full"
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.changes) draft.save(refuse);
      }}
    >
      <RecordBox className={FORM_COLS}>
        <InputGroup>
          <InputGroupAddon><InputGroupText>Name</InputGroupText></InputGroupAddon>
          <InputGroupInput aria-label="Name" value={draft.name} onChange={(e) => draft.setName(e.target.value)} disabled={!draft.editable || draft.pending} />
        </InputGroup>
        <InputGroup>
          <InputGroupAddon><InputGroupText>For</InputGroupText></InputGroupAddon>
          <InputGroupInput aria-label="What it is for" value={draft.sentence} onChange={(e) => draft.setSentence(e.target.value)} disabled={!draft.editable || draft.pending} />
        </InputGroup>
        {draft.editable ? (
          <div className="flex items-center gap-2 @min-[600px]:justify-end">
            <Text role="caption" as="span" aria-live="polite" className="whitespace-nowrap">{status}</Text>
            <Button type="button" variant="outline" disabled={!draft.changes || draft.pending} onClick={draft.discard}>Discard</Button>
            <Button type="submit" disabled={!draft.changes || draft.pending}>Save</Button>
          </div>
        ) : null}
      </RecordBox>
    </form>
  );
}

/** Moving the default to this role, and deleting it. */
function RoleChanges({ role }: { role: RoleRow }) {
  const router = useRouter();
  const { pending, run } = useChange();
  return (
    <Slot fill="background" inset={0} alignY="center">
      <div className="flex flex-wrap gap-2 px-6">
        {!role.isDefault ? (
          <Confirm
            label="Make default"
            title={`Make ${role.name} the default?`}
            line="Everyone who signs up from now on gets this role instead."
            pending={pending}
            onConfirm={() => run(() => makeDefault(role.id))}
          />
        ) : null}
        {!role.builtIn && !role.isDefault ? (
          <Confirm
            label="Delete role"
            destructive
            title={`Delete ${role.name}?`}
            line={role.holders ? "Someone still holds it: take it from them first." : "Nobody holds it. The audit log keeps that it was."}
            pending={pending}
            onConfirm={() => run(() => deleteRole(role.id), () => router.push("/roles"))}
          />
        ) : null}
      </div>
    </Slot>
  );
}

/** An app's name over its permissions, and how many of them the role holds as ticked. */
function AppName({ app, names }: { app: string; names: readonly string[] }) {
  const { ticked } = useDraft();
  return (
    <Slot fill="background" inset={0} alignY="end">
      <div className="flex items-baseline gap-3 px-6 pb-2">
        <Text role="label" as="h2">{app}</Text>
        <Text role="caption" as="span">{names.filter((n) => ticked.has(n)).length} of {names.length}</Text>
      </div>
    </Slot>
  );
}

function PermissionBox({ permission }: { permission: CatalogueEntry }) {
  const draft = useDraft();
  const on = draft.ticked.has(permission.name);
  const id = `permission-${permission.name}`;
  return (
    <RecordBox className={PERM_COLS} fill={on !== draft.held.has(permission.name) ? "muted" : "card"}>
      <div className="flex min-w-0 items-center gap-3 @min-[600px]:contents">
        <Checkbox
          id={id}
          checked={on}
          disabled={!draft.editable || draft.pending}
          onCheckedChange={(next) => draft.tick(permission.name, next === true)}
        />
        <Label htmlFor={id} className="min-w-0 truncate font-mono">{permission.name}</Label>
      </div>
      <Text role="caption" as="span" className="line-clamp-2">{permission.sentence}</Text>
    </RecordBox>
  );
}

/**
 * Leaving with changes not saved asks first: a link on the page — the way back — opens the question here, a reload or a
 * closed tab the browser's own (a page cannot word that one). Turning the role's pages is not leaving.
 */
function LeaveGuard({ roleName, changes }: { roleName: string; changes: number }) {
  const router = useRouter();
  const [leaving, setLeaving] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!changes) return;
    const stay = (event: BeforeUnloadEvent) => event.preventDefault();
    const ask = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.getAttribute("target") === "_blank") return;
      event.preventDefault();
      event.stopPropagation();
      setLeaving(link.getAttribute("href"));
    };
    window.addEventListener("beforeunload", stay);
    document.addEventListener("click", ask, true);
    return () => {
      window.removeEventListener("beforeunload", stay);
      document.removeEventListener("click", ask, true);
    };
  }, [changes]);
  return (
    <AlertDialog
      open={leaving !== null}
      onOpenChange={(next) => {
        if (!next) setLeaving(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            {changes} {changes === 1 ? "change" : "changes"} to {roleName} will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              const to = leaving;
              setLeaving(null);
              if (to) router.push(to);
            }}
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
