"use client";
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens/tokens";
import { Button } from "../atoms/Button";
import { Pattern } from "../atoms/patterns/Pattern";
import type { Family } from "../atoms/patterns/generator";
import { patterns } from "../atoms/patterns/patterns";
import { Field } from "../molecules/Field";
import { Range } from "../molecules/Range";
import type { PatternOption } from "../molecules/PatternPicker";
import { Dialog } from "./Dialog";

/**
 * PatternStudio (Admin.md §6.5b, rule 3) — where a new pattern is made: the generator's twelve geometry dials on a
 * live thumbnail, and a name. Save hands the host a `{ name, family }` to write into the document's own
 * `patterns` map; the `PatternPicker` lists it after the library's eighteen.
 *
 * Every setting is a legal picture by construction (Patterns.md §6.0) — the generator settles its own clearance —
 * which is what makes handing the dials to an author safe. What is NOT here, on purpose: `words`, the boxes a
 * drawing keeps clear, which belong to the cell the pattern is placed in and are measured there by the editor
 * (Scene-Schema.md §3.6). `flow` is a dial; what an angle costs the words is measured where the pattern lands.
 */
export interface PatternStudioProps {
  open: boolean;
  onClose?: () => void;
  onSave?: (pattern: PatternOption) => void;
  /** The cell's hue, so the thumbnail shows what the cell will. */
  hue?: Hue | "accent";
  /** Where the dials start; defaults to `patterns.fan`. */
  initial?: Family;
  initialName?: string;
  /** Names already in use — the library's and the document's — so a new one cannot shadow them. */
  taken?: readonly string[];
  title?: ReactNode;
  /** Renders in the flow of the page instead of as a modal — the catalogue and fixtures. */
  inline?: boolean;
  className?: string;
}

const DEFAULTS: Required<Pick<Family, "waves" | "drift" | "spread" | "taper" | "curl" | "tempo" | "pinch">> = { waves: 2, drift: 0.5, spread: 0.5, taper: 0, curl: 0, tempo: 0, pinch: 0 };

/** Drops the frozen defaults (Patterns.md §6.0a) so a saved pattern says only what it changed. */
export function tidyFamily(f: Family): Family {
  const out: Family = { seed: f.seed, flow: f.flow, scale: f.scale, swing: f.swing, breath: f.breath };
  for (const k of Object.keys(DEFAULTS) as Array<keyof typeof DEFAULTS>) {
    const v = f[k];
    if (v !== undefined && v !== DEFAULTS[k]) out[k] = v;
  }
  return out;
}

export function PatternStudio({ open, onClose, onSave, hue = "accent", initial, initialName = "", taken = [], title = "New pattern", inline, className }: PatternStudioProps) {
  const start = (): Family => ({ ...DEFAULTS, ...(initial ?? patterns.fan), words: undefined });
  const [geom, setGeom] = useState<Family>(start);
  const [name, setName] = useState(initialName);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset the sheet each time it opens, not on every prop change
  useEffect(() => { if (open) { setGeom(start()); setName(initialName); } }, [open]);

  const set = <K extends keyof Family>(k: K) => (v: number) => setGeom((g) => ({ ...g, [k]: v }));
  const trimmed = name.trim().toLowerCase();
  const clash = taken.some((t) => t.toLowerCase() === trimmed);
  const error = trimmed.length === 0 ? undefined : !/^[a-z][a-z0-9-]{0,23}$/.test(trimmed) ? "Lowercase letters, digits and hyphens, up to 24." : clash ? `A pattern named “${trimmed}” already exists.` : undefined;
  const canSave = trimmed.length > 0 && !error;
  const save = () => {
    if (!canSave) return;
    onSave?.({ name: trimmed, family: tidyFamily(geom) });
    onClose?.();
  };
  const ill = hue === "accent" ? undefined : hue;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      modal={!inline}
      size="lg"
      title={title}
      description="Twelve dials on the generator. Every setting is a legal picture; what the words cost is measured where the pattern is placed."
      className={cx("noo-ps-dialog", className)}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>Save pattern</Button>
        </>
      }
    >
      <div className="noo-ps">
        <div className="noo-ps__side">
          <div className="noo-ps__preview" data-hue={hue}>
            <Pattern family={geom} hue={ill} title="The pattern as the dials set it" />
          </div>
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="what shapes it — sweep, hush, lean" error={error} hint={error ? undefined : "Lowercase, one word or hyphenated. It is how the document names the pattern."} maxLength={24} autoComplete="off" spellCheck={false} />
        </div>
        <div className="noo-ps__dials">
          <div className="noo-ps__group">
            <span className="noo-ps__group-label">the family</span>
            <Range label="seed" hint="which picture; the only dial that is not a design decision" value={geom.seed} min={1} max={99} step={1} onChange={set("seed")} />
            <Range label="flow" hint="degrees the family travels" value={geom.flow} min={0} max={180} step={1} unit="°" onChange={set("flow")} />
            <Range label="scale" hint="how much of a larger thing the card holds" value={geom.scale} min={0.6} max={3} step={0.1} onChange={set("scale")} />
            <Range label="swing" hint="how far each line bends" value={geom.swing} min={20} max={60} step={1} onChange={set("swing")} />
            <Range label="breath" hint="units between lines; the count is what fits" value={geom.breath} min={12} max={60} step={1} onChange={set("breath")} />
            <Range label="waves" hint="turns per line" value={geom.waves ?? 2} min={1} max={4} step={1} onChange={set("waves")} />
          </div>
          <div className="noo-ps__group">
            <span className="noo-ps__group-label">the dials and the devices</span>
            <Range label="drift" hint="how much each line differs from its neighbour" value={geom.drift ?? 0.5} min={0} max={1} step={0.05} onChange={set("drift")} />
            <Range label="spread" hint="how unequal the gaps are — a rhythm, never noise" value={geom.spread ?? 0.5} min={0} max={1} step={0.05} onChange={set("spread")} />
            <Range label="taper" hint="the family fans — opens one way, gathers the other" value={geom.taper ?? 0} min={0} max={1} step={0.05} onChange={set("taper")} />
            <Range label="curl" hint="the travel bends into an arc" value={geom.curl ?? 0} min={0} max={1} step={0.05} onChange={set("curl")} />
            <Range label="tempo" hint="the wavelength changes across the family" value={geom.tempo ?? 0} min={0} max={1} step={0.05} onChange={set("tempo")} />
            <Range label="pinch" hint="a waist (−) or a flare (+) mid-travel" value={geom.pinch ?? 0} min={-1} max={1} step={0.05} onChange={set("pinch")} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
