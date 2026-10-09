"use client";

import * as React from "react";

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
import { Button } from "@no-origins/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { Text } from "@no-origins/ui/components/text";
import { Textarea } from "@no-origins/ui/components/textarea";

import { keepable } from "@/engine/bench";
import { resolve } from "@/engine/controls";
import type { AssetVersion, Entry, Values } from "@/engine/types";

/**
 * The configuration on the bench (Cinema.md F11; his, 2026-10-09: "a button in the asset name card where I can see the
 * code view of the configuration that I was playing around with. And if I like the configuration, I should be able to
 * save it… add description to the saved configuration so that agents can understand when to use that configuration,
 * and refer to these configurations to create new configurations"). A window over the bench: every value as it is now,
 * as code, to read and copy; a name and what it is for, to save it (the same name saves its next version); and the
 * configurations he has saved of this asset, each with what it is for, any of them loaded onto the bench to start a new
 * one from.
 */
export function Configuration({ base, one, asset, entry, values, configurations, onSaved, onLoad }: {
  /** Where the entry's page is (`/asset/<id>`, `/effect/<id>`): its configurations are under it. */
  base: string;
  /** What the entry is, as its section calls one: "asset", "effect". */
  one: string;
  asset: string;
  entry: Entry;
  /** The values on the bench now. */
  values: Values;
  configurations: AssetVersion[];
  onSaved: (configurations: AssetVersion[]) => void;
  /** Puts a configuration's values on the bench, every one. */
  onLoad: (values: Values) => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const nameId = React.useId();
  const aboutId = React.useId();

  const all = resolve(entry.controls, values);
  const code = JSON.stringify({ [one]: asset, version: entry.version, values: all }, null, 2);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const response = await fetch(`${base}/configurations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description, values: all }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return setNote(String(body.refused));
    onSaved(body.configurations as AssetVersion[]);
    setNote(`Saved “${body.saved.name}” as version ${body.saved.version}.`);
    setName("");
    setDescription("");
  };

  const load = (saved: AssetVersion) => {
    onLoad(resolve(entry.controls, keepable(entry, saved.use.values)));
    // A loaded configuration is where a new one starts: its name and what it is for, ready to change.
    setName(saved.name);
    setDescription(saved.description ?? "");
    setNote(`“${saved.name}” is on the bench. Save it under a new name for a new configuration, or the same name for its next version.`);
  };

  return (
    <Dialog onOpenChange={(open) => open && setNote("")}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Configuration</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{`${entry.label} · configuration`}</DialogTitle>
          <DialogDescription>Every value on the bench now, as it is saved and as the art department reads it.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65dvh]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <ScrollArea className="h-56 rounded-lg border bg-muted" aria-label="The configuration, as code">
                <Text as="pre" role="mono" className="whitespace-pre p-4">{code}</Text>
              </ScrollArea>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(code).then(() => setNote("Copied."))}>Copy</Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Text role="label" as="h3">Save it</Text>
              <div className="flex flex-col gap-2">
                <Label htmlFor={nameId}>Name</Label>
                <Input id={nameId} value={name} placeholder="Name it" onChange={(event) => setName(event.target.value)} className="h-9" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={aboutId}>When to use it</Label>
                <Textarea id={aboutId} value={description} placeholder="What it is for, so an agent knows when to use it" onChange={(event) => setDescription(event.target.value)} rows={3} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={save} disabled={!name.trim() || saving}>{saving ? "Saving…" : "Save configuration"}</Button>
                {note ? <Text role="caption" aria-live="polite">{note}</Text> : null}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Text role="label" as="h3">Saved</Text>
              {configurations.length ? (
                configurations.map((saved) => (
                  <div key={saved.id} className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Text role="body" weight="heavy" className="truncate">{`${saved.name} · v${saved.version}`}</Text>
                      <Text role="caption">{saved.description ?? "No description yet: an agent will not know when to use it."}</Text>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">Load</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{`Load “${saved.name}”?`}</AlertDialogTitle>
                          <AlertDialogDescription>Its values take the bench&rsquo;s place. What is on the bench now is gone unless you have saved it.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep the bench</AlertDialogCancel>
                          <AlertDialogAction onClick={() => load(saved)}>Load it</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              ) : (
                <Text role="caption">{`None of this ${one} yet.`}</Text>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
