"use client";
import { cx } from "../cx";
import { Button } from "../atoms/Button";
import { Dot } from "../atoms/Dot";
import { Text } from "../atoms/Text";
import type { Hue } from "../tokens/tokens";

/**
 * The save indicator (Admin.md §6.5c S3) — a Dot and a few words in the header's `meta` slot.
 *
 * **Never a toast for a save.** A save is continuous and a toast is an interruption; the one place the state
 * belongs is beside the title, where it is always readable and never in the way. Publish is disabled in every
 * state but `saved`, which is the whole reason this is a control and not a decoration.
 *
 * `aria-live="polite"` on the words, because the dot is the fast read and the words are the true one.
 */
export type SaveStatus = "saved" | "saving" | "unsaved" | "failed" | "stale";

export interface SaveStateProps {
  status: SaveStatus;
  /** Saved: how long ago. Stale: when the other tab saved. Already worded by the host, so it can say "2 min ago". */
  when?: string;
  onRetry?: () => void;
  onReload?: () => void;
  className?: string;
}

const HUE: Record<SaveStatus, Hue> = { saved: "grey", saving: "grey", unsaved: "yellow", failed: "pink", stale: "pink" };

export function SaveState({ status, when, onRetry, onReload, className }: SaveStateProps) {
  const words =
    status === "saved" ? (when ? `saved ${when}` : "saved")
    : status === "saving" ? "saving…"
    : status === "unsaved" ? "unsaved changes"
    : status === "failed" ? "couldn't save — kept here"
    : when ? `stale — saved elsewhere at ${when}` : "stale — saved elsewhere";

  return (
    <span className={cx("noo-esave", className)} data-state={status}>
      <Dot hue={HUE[status]} className="noo-esave__dot" />
      <Text size="small" tone="muted" as="span" aria-live="polite" className="noo-esave__words">{words}</Text>
      {status === "failed" && onRetry ? <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button> : null}
      {status === "stale" && onReload ? <Button variant="ghost" size="sm" onClick={onReload}>Reload</Button> : null}
    </span>
  );
}
