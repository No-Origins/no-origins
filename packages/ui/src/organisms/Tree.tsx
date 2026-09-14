"use client";
import { useRef, useState, type ComponentPropsWithoutRef, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icons/Icon";

/**
 * Tree (Admin.md §10; §6.5a E4) — the editor's outline: the Menu's list grammar with disclosure, and reordering.
 *
 * The WAI-ARIA tree pattern: one tab stop, arrow keys walk the visible items in DOM order (which is tab order,
 * which is reading order), → opens or steps in, ← closes or steps out, Enter or Space selects. `aria-expanded`
 * is the only state the stylesheet reads to hide a branch, so a closed branch is closed for everyone.
 *
 * **Reordering** (E4 A) is on when `onReorder` is given: on the focused row **Alt + ↑/↓** moves it among its
 * siblings and **Alt + ←/→** changes its depth (→ into the previous sibling, ← out after its parent); a grip
 * appears on hover and focus; drag for the mouse, with the drop shown as the editor's one indicator — a 2px accent
 * line with a dot at its head, before or after a row, or the row itself ringed when the drop goes into it. The
 * tree computes the new order and reports it; the host writes the document, so DOM order stays the truth.
 *
 * Controlled or uncontrolled for both `selected` and `expanded`.
 */
export interface TreeNode {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: TreeNode[];
}

/** Where a node ended up: its new parent (`null` at the root) and its index among its siblings. */
export interface TreeMove {
  id: string;
  parent: string | null;
  index: number;
}

export interface TreeProps extends Omit<ComponentPropsWithoutRef<"ul">, "onSelect" | "children"> {
  nodes: readonly TreeNode[];
  /** Names the tree — "Outline". */
  label: string;
  selected?: string;
  defaultSelected?: string;
  onSelect?: (id: string) => void;
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Turns reordering on. Receives the whole tree in its new order, and what moved. */
  onReorder?: (nodes: TreeNode[], move: TreeMove) => void;
}

function visibleIds(nodes: readonly TreeNode[], expanded: Set<string>, out: string[] = []): string[] {
  for (const n of nodes) {
    out.push(n.id);
    if (n.children?.length && expanded.has(n.id)) visibleIds(n.children, expanded, out);
  }
  return out;
}
function parentOf(nodes: readonly TreeNode[], id: string, parent: string | null = null): string | null | undefined {
  for (const n of nodes) {
    if (n.id === id) return parent;
    const p = n.children ? parentOf(n.children, id, n.id) : undefined;
    if (p !== undefined) return p;
  }
  return undefined;
}
function find(nodes: readonly TreeNode[], id: string): TreeNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const c = n.children ? find(n.children, id) : undefined;
    if (c) return c;
  }
  return undefined;
}
function siblingsOf(nodes: readonly TreeNode[], parent: string | null): readonly TreeNode[] {
  return parent === null ? nodes : find(nodes, parent)?.children ?? [];
}
function isInside(nodes: readonly TreeNode[], ancestor: string, id: string): boolean {
  const a = find(nodes, ancestor);
  return Boolean(a?.children && (a.children.some((c) => c.id === id) || a.children.some((c) => isInside([c], c.id, id))));
}
function without(nodes: readonly TreeNode[], id: string): { nodes: TreeNode[]; node?: TreeNode } {
  let node: TreeNode | undefined;
  const walk = (ns: readonly TreeNode[]): TreeNode[] =>
    ns.flatMap((n) => {
      if (n.id === id) { node = n; return []; }
      return [n.children ? { ...n, children: walk(n.children) } : n];
    });
  return { nodes: walk(nodes), node };
}
function insertAt(nodes: readonly TreeNode[], parent: string | null, index: number, node: TreeNode): TreeNode[] {
  if (parent === null) { const a = [...nodes]; a.splice(index, 0, node); return a; }
  return nodes.map((n) => {
    if (n.id === parent) { const c = [...(n.children ?? [])]; c.splice(index, 0, node); return { ...n, children: c }; }
    return n.children ? { ...n, children: insertAt(n.children, parent, index, node) } : n;
  });
}

/**
 * Moves `id` to `parent` at `index`, where `index` counts among the siblings AFTER the node has been taken out.
 * Exported so a host can apply the same move to its own document.
 */
export function moveTreeNode(nodes: readonly TreeNode[], id: string, parent: string | null, index: number): { nodes: TreeNode[]; move: TreeMove } | undefined {
  if (parent !== null && (parent === id || isInside(nodes, id, parent))) return undefined;   // never into itself
  const { nodes: rest, node } = without(nodes, id);
  if (!node) return undefined;
  const sibs = siblingsOf(rest, parent);
  const at = Math.max(0, Math.min(index, sibs.length));
  return { nodes: insertAt(rest, parent, at, node), move: { id, parent, index: at } };
}

type Zone = "before" | "after" | "into";

export function Tree({ nodes, label, selected, defaultSelected, onSelect, expanded, defaultExpanded, onExpandedChange, onReorder, className, ...rest }: TreeProps) {
  const rootRef = useRef<HTMLUListElement>(null);
  const [innerSelected, setInnerSelected] = useState<string | undefined>(defaultSelected);
  const [innerExpanded, setInnerExpanded] = useState<string[]>([...(defaultExpanded ?? [])]);
  const sel = selected ?? innerSelected;
  const exp = new Set(expanded ?? innerExpanded);
  const [focused, setFocused] = useState<string | undefined>(sel ?? nodes[0]?.id);
  const [dragging, setDragging] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ id: string; zone: Zone } | null>(null);
  const reorderable = Boolean(onReorder);

  const select = (id: string) => {
    if (selected === undefined) setInnerSelected(id);
    onSelect?.(id);
  };
  const setExpanded = (next: Set<string>) => {
    const ids = [...next];
    if (expanded === undefined) setInnerExpanded(ids);
    onExpandedChange?.(ids);
  };
  const toggle = (id: string, force?: boolean) => {
    const next = new Set(exp);
    const on = force ?? !next.has(id);
    if (on) next.add(id);
    else next.delete(id);
    setExpanded(next);
  };
  const focusId = (id: string) => {
    setFocused(id);
    rootRef.current?.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus();
  };
  const relocate = (id: string, parent: string | null, index: number) => {
    const r = moveTreeNode(nodes, id, parent, index);
    if (!r) return;
    if (parent !== null && !exp.has(parent)) toggle(parent, true);
    onReorder?.(r.nodes, r.move);
    requestAnimationFrame(() => focusId(id));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-id]")?.dataset.id;
    if (!id) return;
    const visible = visibleIds(nodes, exp);
    const i = visible.indexOf(id);
    const node = find(nodes, id);
    const branch = Boolean(node?.children?.length);

    if (e.altKey && reorderable) {
      const parent = parentOf(nodes, id) ?? null;
      const sibs = siblingsOf(nodes, parent);
      const at = sibs.findIndex((n) => n.id === id);
      switch (e.key) {
        case "ArrowUp": if (at > 0) relocate(id, parent, at - 1); break;
        case "ArrowDown": if (at < sibs.length - 1) relocate(id, parent, at + 1); break;
        case "ArrowRight": { const prev = sibs[at - 1]; if (prev) relocate(id, prev.id, prev.children?.length ?? 0); break; }
        case "ArrowLeft": {
          if (parent === null) break;
          const grand = parentOf(nodes, parent) ?? null;
          const p = siblingsOf(nodes, grand).findIndex((n) => n.id === parent);
          relocate(id, grand, p + 1);
          break;
        }
        default: return;
      }
      e.preventDefault();
      return;
    }

    switch (e.key) {
      case "ArrowDown": if (i < visible.length - 1) focusId(visible[i + 1]!); break;
      case "ArrowUp": if (i > 0) focusId(visible[i - 1]!); break;
      case "Home": focusId(visible[0]!); break;
      case "End": focusId(visible[visible.length - 1]!); break;
      case "ArrowRight":
        if (branch && !exp.has(id)) toggle(id, true);
        else if (branch) focusId(node!.children![0]!.id);
        break;
      case "ArrowLeft": {
        if (branch && exp.has(id)) toggle(id, false);
        else { const p = parentOf(nodes, id); if (p) focusId(p); }
        break;
      }
      case "Enter": case " ": select(id); break;
      default: return;
    }
    e.preventDefault();
  };

  // Drag: a row is the source; over another row the top quarter drops before it, the bottom quarter after it, and
  // the middle into it. Never into itself or its own descendants.
  const onDragStart = (id: string) => (e: DragEvent<HTMLElement>) => {
    e.stopPropagation();
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (id: string) => (e: DragEvent<HTMLElement>) => {
    if (!dragging || dragging === id || isInside(nodes, dragging, id)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const r = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height;
    setDrop({ id, zone: y < 0.25 ? "before" : y > 0.75 ? "after" : "into" });
  };
  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragging && drop) {
      if (drop.zone === "into") {
        relocate(dragging, drop.id, find(nodes, drop.id)?.children?.length ?? 0);
      } else {
        const parent = parentOf(nodes, drop.id) ?? null;
        const { nodes: rest } = without(nodes, dragging);
        const at = siblingsOf(rest, parent).findIndex((n) => n.id === drop.id);
        relocate(dragging, parent, drop.zone === "before" ? at : at + 1);
      }
    }
    setDragging(null);
    setDrop(null);
  };
  const onDragEnd = () => { setDragging(null); setDrop(null); };

  const renderNodes = (ns: readonly TreeNode[], depth: number) =>
    ns.flatMap((n) => {
      const branch = Boolean(n.children?.length);
      const isOpen = branch && exp.has(n.id);
      const here = drop?.id === n.id ? drop.zone : undefined;
      const item = (
        <li
          key={n.id}
          role="treeitem"
          data-id={n.id}
          aria-expanded={branch ? isOpen : undefined}
          aria-selected={sel === n.id}
          aria-level={depth + 1}
          tabIndex={focused === n.id ? 0 : -1}
          className={cx("noo-tree__item", dragging === n.id && "is-dragging")}
          onFocus={(e) => { if (e.target === e.currentTarget) setFocused(n.id); }}
        >
          <div
            className={cx("noo-tree__row", here === "into" && "noo-tree__row--into")}
            draggable={reorderable || undefined}
            onDragStart={reorderable ? onDragStart(n.id) : undefined}
            onDragOver={reorderable ? onDragOver(n.id) : undefined}
            onDrop={reorderable ? onDrop : undefined}
            onDragEnd={reorderable ? onDragEnd : undefined}
            onClick={() => { select(n.id); focusId(n.id); }}
          >
            {reorderable ? (
              <span className="noo-tree__grip" aria-hidden="true"><Icon name="grip" size="sm" /></span>
            ) : null}
            <span
              className={cx("noo-tree__caret", !branch && "noo-tree__caret--leaf")}
              aria-hidden="true"
              onClick={branch ? (e) => { e.stopPropagation(); toggle(n.id); } : undefined}
            >
              <svg viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" style={{ fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" }} /></svg>
            </span>
            {n.icon ? <span className="noo-tree__icon" aria-hidden="true">{n.icon}</span> : null}
            <span className="noo-tree__label">{n.label}</span>
          </div>
          {branch ? <ul role="group" className="noo-tree__group">{renderNodes(n.children!, depth + 1)}</ul> : null}
        </li>
      );
      return [
        here === "before" ? <li key={`${n.id}-drop-before`} role="none" className="noo-drop" aria-hidden="true" /> : null,
        item,
        here === "after" ? <li key={`${n.id}-drop-after`} role="none" className="noo-drop" aria-hidden="true" /> : null,
      ];
    });

  return (
    <ul
      ref={rootRef}
      role="tree"
      aria-label={label}
      className={cx("noo-tree", reorderable && "noo-tree--reorderable", className)}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {renderNodes(nodes, 0)}
    </ul>
  );
}
