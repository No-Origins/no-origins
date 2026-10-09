"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ENTRIES, PALETTE, PALETTES } from "@cinema/content";

import { Button } from "@no-origins/ui/components/button";
import { Grid, GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

import { Configuration } from "@/components/configuration";
import { EntryJigs, Jig, JigColumn } from "@/components/jigs";
import { palettesOf } from "@/components/palettes";
import { Picture } from "@/components/picture";
import { benchShot } from "@/engine/bench";
import { makeLibrary } from "@/engine/library";
import type { AssetBook, AssetVersion, Bench, Entry, Value, Values } from "@/engine/types";
import { benchLayout } from "@/lib/layout";
import type { Section } from "@/lib/sections";

const library = makeLibrary(ENTRIES);
/** A change is saved once the jigs have stood still this long, as the studio's are. */
const SAVE_MS = 500;
const STILL = { t: 0, n: 0 };
/** How long an asset that moves by itself (a cloud) runs on its page before its time starts again. */
const HOUR = 3600;
const ignore = () => {};
/** A bench's asset stands alone: it draws on none of his saved configurations. One object, so the picture keeps it. */
const NONE: AssetBook = {};

type Save = { state: "idle" | "saving" | "saved" | "refused"; note?: string };

/**
 * An asset's bench (Cinema.md F11, Cinema-Engine.md E1; his, 2026-10-09: "I should just be able to see the asset in
 * the 3D space and look at it and play around with it"): the asset alone at the centre, looked round freely from a
 * view of the whole of it (Escape goes back to it), lit by the plain sun; at the top left the card that says which
 * asset it is, a back arrow before its name (his, the same day: "that's where we usually put the cards that define
 * the asset"; "a back arrow button before the asset name"), then its controls either side, a card a group, as the
 * studio draws them.
 * A change shows at once and is saved to the bench once the jigs stand still. No camera, no time, no shot. The
 * asset's card opens the configuration: the values as code, saved under his name with what it is for, and the ones he
 * saved before, loaded to start a new one from (`configuration.tsx`).
 */
function Workbench({ initial, section, configurations: saved }: { initial: Bench; section: Section; configurations: AssetVersion[] }) {
  const metrics = useGridMetrics();
  const [bench, setBench] = React.useState(initial);
  const [configurations, setConfigurations] = React.useState(saved);
  const [free, setFree] = React.useState(false);
  const [problems, setProblems] = React.useState<string[]>([]);
  const [save, setSave] = React.useState<Save>({ state: "idle" });
  const rev = React.useRef(initial.rev);
  const pending = React.useRef<Values>({});
  const timer = React.useRef<number | undefined>(undefined);
  const busy = React.useRef(false);

  const entry = library.find(bench.asset, bench.version);
  const shot = React.useMemo(() => benchShot(bench, entry?.label ?? bench.asset), [bench, entry]);
  const palettes = React.useMemo(() => palettesOf(library, shot.world ? [shot.world] : [], PALETTE, PALETTES), [shot]);

  // One save at a time, in order; what changes while one is out goes in the next.
  const flush = React.useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      while (Object.keys(pending.current).length) {
        const values = pending.current;
        pending.current = {};
        setSave({ state: "saving" });
        const response = await fetch(`${section.path}/${initial.asset}/bench`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rev: rev.current, values }),
        });
        const body = await response.json();
        if (!response.ok) {
          if (response.status === 409) {
            rev.current = body.bench.rev;
            pending.current = {};
            setBench(body.bench);
          }
          setSave({ state: "refused", note: String(body.refused) });
          return;
        }
        rev.current = body.rev;
        setBench({ ...body, values: { ...body.values, ...pending.current } });
        setSave({ state: "saved" });
      }
    } finally {
      busy.current = false;
    }
  }, [initial.asset, section.path]);

  const change = (control: string, value: Value) => {
    setBench((now) => ({ ...now, values: { ...now.values, [control]: value } }));
    pending.current = { ...pending.current, [control]: value };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_MS);
  };
  /** A saved configuration loaded: every value of it on the bench, saved at once. */
  const replace = (values: Values) => {
    setBench((now) => ({ ...now, values }));
    pending.current = { ...values };
    window.clearTimeout(timer.current);
    void flush();
  };

  if (!metrics || !entry) return null;
  const layout = benchLayout(metrics.cols, metrics.rows);

  // The groups shared out between the columns in their order, the first on the left under the asset's card, where the
  // taller column is shortest. A card is about a row for its heading and one for each control, two for a colour's
  // swatches; the asset's card about four.
  const groups = [...new Set(entry.controls.map((control) => control.group ?? entry.label))];
  const tall = (group: string) =>
    1 + entry.controls.filter((control) => (control.group ?? entry.label) === group).reduce((rows, control) => rows + (control.kind === "colour" ? 2 : 1), 0);
  const heights = groups.map(tall);
  const sum = (from: number, to: number) => heights.slice(from, to).reduce((a, b) => a + b, 0);
  let split = groups.length;
  if (layout.right) {
    split = 1;
    for (let k = 2; k <= groups.length; k++) if (Math.max(4 + sum(0, k), sum(k, groups.length)) < Math.max(4 + sum(0, split), sum(split, groups.length))) split = k;
  }
  const left = groups.slice(0, split);
  const part = (names: readonly string[]) => ({ ...entry, controls: entry.controls.filter((control) => names.includes(control.group ?? entry.label)) }) as Entry;
  const jigs = (names: readonly string[]) =>
    names.length ? (
      <EntryJigs entry={part(names)} values={bench.values} title={entry.label} bare palettes={palettes} assets={NONE} library={library} onChange={change} />
    ) : null;

  const card = (
    <Jig
      title={entry.label}
      note={`${section.one[0]!.toUpperCase()}${section.one.slice(1)} · version ${entry.version} · ${entry.controls.length} controls`}
      lead={
        // His (2026-10-09): a back arrow before the asset's name, in place of an "All assets" button. It goes home to
        // the page of its own section.
        <Button asChild variant="outline" size="icon-sm" aria-label={`Back to the ${section.label.toLowerCase()}`}>
          <Link href={`/?section=${section.id}`}>
            <ArrowLeft />
          </Link>
        </Button>
      }
    >
      <Text role="caption" tone="muted" className="col-span-2">{entry.description}</Text>
      <div className="col-span-2 flex flex-wrap gap-2">
        <Configuration base={`${section.path}/${bench.asset}`} one={section.one} asset={bench.asset} entry={entry} values={bench.values} configurations={configurations} onSaved={setConfigurations} onLoad={replace} />
      </div>
    </Jig>
  );
  const column = (children: React.ReactNode, label: string) => <JigColumn label={label}>{children}</JigColumn>;
  const right = groups.filter((group) => !left.includes(group));

  return (
    <>
      <GridItem {...layout.picture} data-cinema-part="picture">
        <Slot fill="background" inset={0}>
          <Picture shot={shot} assets={NONE} aspect="wide" length={HOUR} playing={false} seek={STILL} free={free} onFree={setFree} onTime={ignore} onProblems={setProblems} overview />
        </Slot>
      </GridItem>
      <GridItem {...layout.left} data-cinema-part="asset">
        {column(<>{card}{jigs(layout.right ? left : groups)}</>, `${entry.label}, and its controls`)}
      </GridItem>
      {layout.right && (
        <GridItem {...layout.right} data-cinema-part="controls">
          {column(jigs(right), `More of ${entry.label}'s controls`)}
        </GridItem>
      )}
      <GridItem {...layout.caption} data-cinema-part="name">
        <Slot fill="transparent" inset={0} alignX="center" alignY="center">
          <div aria-live="polite" className="flex min-w-0 flex-col items-center">
            <Text role="title" as="h2" align="center" className="truncate">{entry.label}</Text>
            {problems.length ? (
              <Text role="caption" align="center">{problems.join(" · ")}</Text>
            ) : save.state === "refused" ? (
              <Text role="caption" align="center">{save.note}</Text>
            ) : save.state !== "idle" ? (
              <Text role="caption" align="center">{save.state === "saving" ? "Saving…" : `Saved, revision ${bench.rev}`}</Text>
            ) : (
              <Text role="caption" align="center">Drag to look round; the wheel, or a pinch, to go nearer</Text>
            )}
          </div>
        </Slot>
      </GridItem>
    </>
  );
}

/** The studios' grid: the field drawn, the pointer a violet ring, no intro (Grid.md D49). */
export function AssetBench({ initial, title, section, configurations }: { initial: Bench; title: string; section: Section; configurations: AssetVersion[] }) {
  return (
    <Grid overlay cursor>
      <h1 className="sr-only">{`Cinema: ${title}`}</h1>
      <Workbench initial={initial} section={section} configurations={configurations} />
    </Grid>
  );
}
