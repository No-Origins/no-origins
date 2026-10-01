"use client";

import * as React from "react";
import { History, Plus, Send } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@no-origins/ui/components/alert-dialog";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@no-origins/ui/components/dialog";
import { GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@no-origins/ui/components/item";
import { Text } from "@no-origins/ui/components/text";

import { useCharacter, type SaveStatus } from "@/components/character-context";
import { PillCard } from "@/components/section";
import type { StudioBox } from "@/lib/stage";
import type { CharacterVersion } from "@/app/actions";
import { nextVersion, versionName } from "@/lib/versions";

/**
 * The character's draft and versions (Orbit.md C6, C11, C19): **a bar on the field's last row under the
 * circle**, between the two rooms' pagers and built as they are — a circle, then a pill. The draft and its versions are
 * the whole character's, not a part of its look. The circle opens the versions: a row for each, newest first, the one
 * pages show marked "Showing" and any other one to go back to, asked twice, and over them the next major, to publish.
 * The pill is which character is open — and, at the end of its list, a new one by its name — whether the draft is
 * saved, and Publish, which makes it the latest's next minor version at a press (his, 2026-10-01: *"if I publish
 * directly then it should auto increment the minor version"*). A version has no name: the character has one (his: *"I
 * don't want to give a name for each version"*). A version never changes: any change after one is the next publish
 * (his: "Each publish should be treated as a version").
 */

const STATUS: Record<SaveStatus, string> = {
  loading: "Loading…",
  saved: "Draft saved",
  unsaved: "Not saved yet",
  saving: "Saving…",
  conflict: "Changed elsewhere",
  offline: "Not saved here",
  "signed-out": "Signed out",
  error: "Not saved",
};

/** The item at the end of the character list that is not a character: a new one (C19). */
const NEW_CHARACTER = "action:new";

export function DraftBar({ box }: { box: StudioBox }) {
  const { status, message, versions, connected, publish, characterId, characters, open, reload } = useCharacter();
  const metrics = useGridMetrics();
  const cell = metrics?.cell ?? 60;
  const gap = metrics?.gap ?? 12;
  const [creating, setCreating] = React.useState(false);
  const next = versionName(nextVersion(versions, "minor"));
  const busy = status === "saving" || status === "loading";
  // What went wrong with the last ask, in its own words, in place of the state.
  const said = message && (status === "error" || status === "conflict" || status === "saved") ? message : null;

  return (
    <GridItem {...box} data-studio-part="draft">
      <div className="grid h-full" style={{ gridTemplateColumns: `${cell}px minmax(0, 1fr)`, gap }}>
        <VersionsDialog />
        {/* A container, so a bar only four cells across (a short laptop's) drops the state's words, and Publish its word
            for its mark, to leave the version its room. */}
        <PillCard className="@container gap-3 px-4" title={said ?? STATUS[status]}>
          {/* Which of the characters is open (C13), and a new one at the end of the list (C19). Only where there is a
              database to hold them. */}
          {connected && characterId ? (
            <Select
              value={characterId}
              onValueChange={(next) => {
                if (next === NEW_CHARACTER) setCreating(true);
                else void open(next);
              }}
            >
              <SelectTrigger size="sm" aria-label="Agent" className="w-auto min-w-0 shrink" data-character={characters.find((c) => c.id === characterId)?.name}>
                <SelectValue />
              </SelectTrigger>
              {/* Above the bar, the whole list: the bar is on the field's last row, and a list laid over its trigger
                  there scrolls, hiding the new one at its end. */}
              <SelectContent position="popper" side="top" align="start">
                {characters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={NEW_CHARACTER}>
                  <Plus aria-hidden />
                  New agent…
                </SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <Text role="caption" className="hidden min-w-0 flex-1 truncate @min-[18rem]:block" data-save-status={status}>
            {said ?? STATUS[status]}
          </Text>
          {status === "conflict" ? <Button size="sm" variant="outline" className="shrink-0" onClick={() => void reload()}>Load it</Button> : null}
          <Button
            size="sm"
            className="ml-auto shrink-0"
            aria-label={connected ? `Publish ${next}` : "Publish"}
            title={connected ? `Publish the draft as version ${next}, the next minor` : undefined}
            data-publish={connected ? next : undefined}
            disabled={!connected || busy}
            onClick={() => void publish("minor")}
          >
            <Send aria-hidden className="hidden @max-[15rem]:block" />
            <span className="@max-[15rem]:hidden">Publish</span>
            {connected ? <span>{next}</span> : null}
          </Button>
        </PillCard>
      </div>
      <NewCharacterDialog open={creating} onOpenChange={setCreating} />
    </GridItem>
  );
}

/** A new character (C19): its name, and nothing else. It opens with the default look and no versions; its first publish is 1.0. */
function NewCharacterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The content mounts each time it opens, so the name starts empty every time. */}
      <DialogContent>
        <NewCharacterForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function NewCharacterForm({ onDone }: { onDone: () => void }) {
  const { create } = useCharacter();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const result = await create(name);
    setSaving(false);
    if (result.ok) onDone();
    else setError(result.message);
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <DialogHeader>
        <DialogTitle>New agent</DialogTitle>
        <DialogDescription>
          Name it, and it opens with the default look. Each publish after that is its next version, from 1.0.
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-w-0 items-center gap-3">
        <Label htmlFor="new-agent-name" className="w-20 shrink-0">Name</Label>
        <Input id="new-agent-name" value={name} autoFocus onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1" />
      </div>
      {error ? <Text role="caption" data-create-error>{error}</Text> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={!name.trim() || saving}>{saving ? "Making it…" : "Make it"}</Button>
      </DialogFooter>
    </form>
  );
}

/** The versions, opened from the bar's circle: the next major to publish, then a row each, newest first. */
function VersionsDialog() {
  const { status, versions, currentId, connected, characterId, characters, publish, restore } = useCharacter();
  const [open, setOpen] = React.useState(false);
  const busy = status === "saving" || status === "loading";
  const name = characters.find((c) => c.id === characterId)?.name;
  const minor = versionName(nextVersion(versions, "minor"));
  const major = versionName(nextVersion(versions, "major"));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="size-full" aria-label="Versions" title="Versions">
          <History />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name ? `Versions of ${name}` : "Versions"}</DialogTitle>
          <DialogDescription>
            {versions.length
              ? `Publish in the bar makes ${minor}, the next minor version; a new major starts at ${major}. ` +
                "Going back to a version makes it the one pages show and the draft its look. Nothing is renumbered."
              : "Its first publish is 1.0."}
          </DialogDescription>
        </DialogHeader>
        {connected ? (
          <ItemGroup className="max-h-[60dvh] gap-2 overflow-y-auto">
            {versions.length ? (
              <Item variant="outline" size="sm" role="listitem" data-next-major={major}>
                <ItemContent className="min-w-0">
                  <ItemTitle className="min-w-0 tracking-normal normal-case">
                    <Text role="mono" as="span" className="shrink-0">v{major}</Text>
                    <Text as="span" className="truncate">A new major version</Text>
                  </ItemTitle>
                  <ItemDescription>The draft as it stands</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    size="xs"
                    disabled={busy}
                    aria-label={`Publish ${major}`}
                    onClick={async () => {
                      if (await publish("major")) setOpen(false);
                    }}
                  >
                    Publish
                  </Button>
                </ItemActions>
              </Item>
            ) : null}
            {versions.map((v) => (
              <VersionItem key={v.id} version={v} current={v.id === currentId} next={minor} busy={busy} onRestore={restore} />
            ))}
          </ItemGroup>
        ) : (
          <Text role="caption">Versions live in the database, which this server has no keys for.</Text>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VersionItem({ version: v, current, next, busy, onRestore }: {
  version: CharacterVersion;
  current: boolean;
  next: string;
  busy: boolean;
  onRestore: (id: string) => Promise<boolean>;
}) {
  const number = versionName(v);
  return (
    <Item variant="outline" size="sm" role="listitem" data-version={number}>
      <ItemContent className="min-w-0">
        {/* A name as he typed it, where a version has one (the first ones did): an item's title is set in capitals, a
            name is his words. */}
        <ItemTitle className="min-w-0 tracking-normal normal-case">
          <Text role="mono" as="span" className="shrink-0">v{number}</Text>
          {v.label ? <Text as="span" className="truncate">{v.label}</Text> : null}
        </ItemTitle>
        <ItemDescription>{new Date(v.publishedAt).toLocaleString()}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {current ? (
          <Badge variant="outline">Showing</Badge>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="xs" variant="outline" disabled={busy}>Go back</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Go back to version {number}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Pages show version {number}{v.label ? `, “${v.label}”,` : ""} again, and the draft becomes its look.
                  Nothing is renumbered: the next publish is {next}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void onRestore(v.id)}>Go back</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </ItemActions>
    </Item>
  );
}
