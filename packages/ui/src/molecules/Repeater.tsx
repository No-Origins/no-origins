"use client";
import { useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens/tokens";
import { Button } from "../atoms/Button";
import { Chip } from "../atoms/Chip";
import { Icon } from "../icons/Icon";

/**
 * Repeater (Admin.md §6.5a, E3 A + C) — the control a `list` prop renders in the inspector.
 *
 * **Rows**: one per item on hairlines; the item's fields inline, rendered by the host from the same schema the
 * inspector already renders (`renderItem`); a grip to drag, × to remove, a ghost *Add* under the last row, the
 * count against `max` in a caption. **Chips** is the same component's compact form for a list of short text or
 * `{label, hue}`: each item a Chip with a remove mark, the chosen chip's fields below the row.
 *
 * Alt + ↑/↓ on a row or a chip moves it; drag does the same for the mouse, and the drop is shown as the editor's
 * one drop indicator — a 2px accent line with a dot at its head — which `Tree` shares. Controlled with `items` +
 * `onChange`, or uncontrolled with `defaultItems`.
 */
export interface RepeaterProps<T> {
  items?: readonly T[];
  defaultItems?: readonly T[];
  onChange?: (items: T[]) => void;
  /** Draws one item's fields. `set` replaces that item. */
  renderItem: (item: T, index: number, set: (next: T) => void) => ReactNode;
  /** What *Add* appends. */
  newItem: () => T;
  /** Names the list — "Chips", "Details". */
  label: string;
  /** Names one item for assistive tech — "chip", "detail". */
  itemName?: string;
  max?: number;
  addLabel?: string;
  density?: "rows" | "chips";
  /** Chips density: what the chip says. */
  chipLabel?: (item: T) => ReactNode;
  /** Chips density: the chip's hue. */
  chipHue?: (item: T) => Hue | "accent" | undefined;
  disabled?: boolean;
  className?: string;
}

function moved<T>(arr: readonly T[], from: number, to: number): T[] {
  const a = [...arr];
  const [it] = a.splice(from, 1);
  a.splice(to, 0, it as T);
  return a;
}

export function Repeater<T>({ items, defaultItems, onChange, renderItem, newItem, label, itemName = "item", max, addLabel = "Add", density = "rows", chipLabel, chipHue, disabled, className }: RepeaterProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState<readonly T[]>(defaultItems ?? []);
  const list = items ?? inner;
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<{ index: number; after: boolean } | null>(null);
  const [chosen, setChosen] = useState<number>(0);
  const full = max !== undefined && list.length >= max;

  const commit = (next: T[]) => {
    if (items === undefined) setInner(next);
    onChange?.(next);
  };
  const setAt = (i: number) => (next: T) => commit(list.map((it, j) => (j === i ? next : it)));
  const remove = (i: number) => {
    commit(list.filter((_, j) => j !== i));
    setChosen((c) => Math.max(0, Math.min(c > i ? c - 1 : c, list.length - 2)));
  };
  const add = () => {
    if (full || disabled) return;
    commit([...list, newItem()]);
    setChosen(list.length);
  };
  const focusHandle = (i: number) => {
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-index="${i}"] [data-handle], [data-index="${i}"][data-handle]`)?.focus());
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    commit(moved(list, from, to));
    setChosen((c) => (c === from ? to : c));
    focusHandle(to);
  };
  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLElement>) => {
    if (!e.altKey || disabled) return;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); move(i, i - 1); }
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); move(i, i + 1); }
  };

  // Drag: the whole row (or chip) is the source; the drop lands before or after whichever item the pointer is over.
  const onDragStart = (i: number) => (e: DragEvent) => {
    if (disabled) { e.preventDefault(); return; }
    setDragging(i);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
  };
  const onDragOver = (i: number) => (e: DragEvent<HTMLElement>) => {
    if (dragging === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const r = e.currentTarget.getBoundingClientRect();
    const after = density === "chips" ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
    setOver({ index: i, after });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (dragging !== null && over) {
      const insertion = over.after ? over.index + 1 : over.index;
      const to = insertion > dragging ? insertion - 1 : insertion;
      if (to !== dragging) { commit(moved(list, dragging, to)); setChosen((c) => (c === dragging ? to : c)); }
    }
    setDragging(null);
    setOver(null);
  };
  const onDragEnd = () => { setDragging(null); setOver(null); };
  const dropMark = (i: number, vertical: boolean) => (over && over.index === i ? <li key={`drop-${i}-${over.after ? "a" : "b"}`} className={cx("noo-drop", vertical && "noo-drop--v")} aria-hidden="true" /> : null);

  const count = max !== undefined ? `${list.length} of ${max}` : `${list.length}`;

  if (density === "chips") {
    const current = list[chosen];
    return (
      <div ref={rootRef} className={cx("noo-rep", "noo-rep--chips", disabled && "is-disabled", className)} role="group" aria-label={label}>
        <span className="noo-rep__label">{label}</span>
        <ul className="noo-rep__chips" onDrop={onDrop} onDragOver={(e) => { if (dragging !== null) e.preventDefault(); }}>
          {list.flatMap((it, i) => [
            over && over.index === i && !over.after ? dropMark(i, true) : null,
            <li
              key={i}
              data-index={i}
              data-handle=""
              tabIndex={disabled ? -1 : 0}
              aria-pressed={chosen === i}
              aria-label={`${itemName} ${i + 1} of ${list.length}. Alt and an arrow moves it.`}
              className={cx("noo-rep__chip", dragging === i && "is-dragging")}
              draggable={!disabled}
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver(i)}
              onDragEnd={onDragEnd}
              onKeyDown={onKeyDown(i)}
              onClick={() => setChosen(i)}
            >
              <Chip hue={chipHue?.(it) ?? "accent"} dot>{chipLabel ? chipLabel(it) : String(it)}</Chip>
              <button type="button" className="noo-rep__chipx" aria-label={`Remove ${itemName} ${i + 1}`} disabled={disabled} onClick={(e) => { e.stopPropagation(); remove(i); }}>
                <Icon name="close" size="sm" />
              </button>
            </li>,
            over && over.index === i && over.after ? dropMark(i, true) : null,
          ])}
          <li className="noo-rep__addchip">
            <Chip hue="grey" leading={<Icon name="plus" size="sm" />} onClick={add} aria-disabled={full || disabled ? true : undefined}>{addLabel}</Chip>
          </li>
        </ul>
        {current !== undefined ? <div className="noo-rep__edit">{renderItem(current, chosen, setAt(chosen))}</div> : null}
        <div className="noo-rep__foot"><span className="noo-rep__count">{count}</span></div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cx("noo-rep", disabled && "is-disabled", className)} role="group" aria-label={label}>
      <span className="noo-rep__label">{label}</span>
      <ul className="noo-rep__list" onDrop={onDrop} onDragOver={(e) => { if (dragging !== null) e.preventDefault(); }}>
        {list.flatMap((it, i) => [
          over && over.index === i && !over.after ? dropMark(i, false) : null,
          <li
            key={i}
            data-index={i}
            className={cx("noo-rep__row", dragging === i && "is-dragging")}
            draggable={!disabled}
            onDragStart={onDragStart(i)}
            onDragOver={onDragOver(i)}
            onDragEnd={onDragEnd}
            onKeyDown={onKeyDown(i)}
          >
            <button type="button" data-handle="" className="noo-rep__grip" aria-label={`Move ${itemName} ${i + 1} of ${list.length}: Alt and an arrow`} disabled={disabled}>
              <Icon name="grip" size="sm" />
            </button>
            <div className="noo-rep__fields">{renderItem(it, i, setAt(i))}</div>
            <button type="button" className="noo-rep__x" aria-label={`Remove ${itemName} ${i + 1}`} disabled={disabled} onClick={() => remove(i)}>
              <Icon name="close" size="sm" />
            </button>
          </li>,
          over && over.index === i && over.after ? dropMark(i, false) : null,
        ])}
      </ul>
      <div className="noo-rep__foot">
        <Button variant="ghost" size="sm" leading={<Icon name="plus" size="sm" />} onClick={add} disabled={full || disabled}>{addLabel}</Button>
        <span className="noo-rep__count">{count}</span>
      </div>
    </div>
  );
}
