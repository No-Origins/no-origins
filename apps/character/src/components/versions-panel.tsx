"use client";

import * as React from "react";
import { History, Send } from "lucide-react";

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { Input } from "@no-origins/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@no-origins/ui/components/item";
import { Text } from "@no-origins/ui/components/text";

import { useCharacter, type SaveStatus } from "@/components/character-context";
import { PillCard } from "@/components/section";
import type { StudioBox } from "@/lib/stage";
import type { CharacterVersion } from "@/app/actions";

/**
 * The character's draft and versions (Character-Studio.md C6, C11): **a bar on the field's last row under the circle**,
 * between the two rooms' pagers and built as they are — a circle, then a pill (his, 2026-09-30: *"the controls … are
 * all over the place … reorganize them"*: it was the first section of the room to the right, above the body's shape
 * and colour, under a pager that said Body). The draft and its versions are the whole character's, not a part of its
 * look. The circle opens the versions: a row for each, newest first, the one pages show marked "Showing" and any other
 * one to go back to, asked twice. The pill is whether the draft is saved, then the name he types (Admin.md R1) and
 * Publish, which makes it the next version. A version never changes: any change after one is the next publish (his:
 * "Each publish should be treated as a version").
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

export function DraftBar({ box }: { box: StudioBox }) {
  const { status, message, versions, connected, publish, reload, characterId, characters, open } = useCharacter();
  const metrics = useGridMetrics();
  const cell = metrics?.cell ?? 60;
  const gap = metrics?.gap ?? 12;
  const [label, setLabel] = React.useState("");
  const next = (versions[0]?.number ?? 12) + 1;
  const busy = status === "saving" || status === "loading";
  // What went wrong with the last ask, in its own words, in place of the state.
  const said = message && (status === "error" || status === "conflict" || status === "saved") ? message : null;

  const submit = async () => {
    if (!label.trim()) return;
    if (await publish(label)) setLabel("");
  };

  return (
    <GridItem {...box} data-studio-part="draft">
      <div className="grid h-full" style={{ gridTemplateColumns: `${cell}px minmax(0, 1fr)`, gap }}>
        <VersionsDialog next={next} />
        {/* A container, so a bar only four cells across (a short laptop's) drops the state's words, and Publish its word
            for its mark, to leave the name its room. */}
        <PillCard className="@container gap-3 px-4" title={said ?? STATUS[status]}>
          {/* Which of the characters is open (C13, Agents.md): the six, and any made since. Only where there is a database
              to hold more than the one the code declares. */}
          {characters.length > 1 && characterId ? (
            <Select value={characterId} onValueChange={(next) => void open(next)}>
              <SelectTrigger size="sm" aria-label="Character" className="w-auto shrink-0" data-character={characters.find((c) => c.id === characterId)?.name}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {characters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Text role="caption" className="hidden max-w-[40%] shrink-0 truncate @min-[18rem]:block" data-save-status={status}>
            {said ?? STATUS[status]}
          </Text>
          {status === "conflict" ? <Button size="sm" variant="outline" className="shrink-0" onClick={() => void reload()}>Load it</Button> : null}
          <form
            className="flex min-w-0 flex-1 items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <Input
              aria-label="Name the version"
              placeholder={`Name v${next}`}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              disabled={!connected}
              className="h-9 min-w-0 flex-1"
            />
            <Button
              type="submit"
              size="sm"
              className="shrink-0 @max-[15rem]:w-9 @max-[15rem]:px-0"
              aria-label="Publish"
              disabled={!connected || busy || !label.trim()}
            >
              <Send aria-hidden className="hidden @max-[15rem]:block" />
              <span className="@max-[15rem]:hidden">Publish</span>
            </Button>
          </form>
        </PillCard>
      </div>
    </GridItem>
  );
}

/** The versions, opened from the bar's circle: a row each, newest first. */
function VersionsDialog({ next }: { next: number }) {
  const { status, versions, currentId, connected, restore } = useCharacter();
  const busy = status === "saving" || status === "loading";
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="size-full" aria-label="Versions" title="Versions">
          <History />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Versions</DialogTitle>
          <DialogDescription>
            Pages show the one marked Showing. Going back to another makes it the one they show and the draft its look;
            nothing is renumbered, and the next publish is version {next}.
          </DialogDescription>
        </DialogHeader>
        {versions.length ? (
          <ItemGroup className="max-h-[60dvh] gap-2 overflow-y-auto">
            {versions.map((v) => (
              <VersionItem key={v.id} version={v} current={v.id === currentId} next={next} busy={busy} onRestore={restore} />
            ))}
          </ItemGroup>
        ) : (
          <Text role="caption">
            {connected ? "No versions yet." : "Versions live in the database, which this server has no keys for."}
          </Text>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VersionItem({ version: v, current, next, busy, onRestore }: {
  version: CharacterVersion;
  current: boolean;
  next: number;
  busy: boolean;
  onRestore: (id: string) => Promise<boolean>;
}) {
  return (
    <Item variant="outline" size="sm" role="listitem" data-version={v.number}>
      <ItemContent className="min-w-0">
        {/* His name as he typed it: an item's title is set in capitals, a version's name is his words. */}
        <ItemTitle className="min-w-0 tracking-normal normal-case">
          <Text role="mono" as="span" className="shrink-0">v{v.number}</Text>
          <Text as="span" className="truncate">{v.label}</Text>
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
                <AlertDialogTitle>Go back to version {v.number}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Pages show version {v.number}, “{v.label}”, again, and the draft becomes its look. Nothing is renumbered: the next
                  publish is version {next}.
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
