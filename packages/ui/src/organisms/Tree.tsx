"use client";
import { useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Tree (Admin.md §10) — the editor's outline: the Menu's list grammar with disclosure.
 *
 * The WAI-ARIA tree pattern: one tab stop, arrow keys walk the visible items in DOM order (which is tab order,
 * which is reading order), → opens or steps in, ← closes or steps out, Enter or Space selects. `aria-expanded`
 * is the only state the stylesheet reads to hide a branch, so a closed branch is closed for everyone.
 *
 * Controlled or uncontrolled for both `selected` and `expanded`. Reordering is the host's (the editor knows the
 * document); this component only shows and selects.
 */
export interface TreeNode {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: TreeNode[];
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
}

function visibleIds(nodes: readonly TreeNode[], expanded: Set<string>, out: string[] = []): string[] {
  for (const n of nodes) {
    out.push(n.id);
    if (n.children?.length && expanded.has(n.id)) visibleIds(n.children, expanded, out);
  }
  return out;
}
function parentOf(nodes: readonly TreeNode[], id: string, parent?: string): string | undefined {
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

export function Tree({ nodes, label, selected, defaultSelected, onSelect, expanded, defaultExpanded, onExpandedChange, className, ...rest }: TreeProps) {
  const rootRef = useRef<HTMLUListElement>(null);
  const [innerSelected, setInnerSelected] = useState<string | undefined>(defaultSelected);
  const [innerExpanded, setInnerExpanded] = useState<string[]>([...(defaultExpanded ?? [])]);
  const sel = selected ?? innerSelected;
  const exp = new Set(expanded ?? innerExpanded);
  const [focused, setFocused] = useState<string | undefined>(sel ?? nodes[0]?.id);

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

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-id]")?.dataset.id;
    if (!id) return;
    const visible = visibleIds(nodes, exp);
    const i = visible.indexOf(id);
    const node = find(nodes, id);
    const branch = Boolean(node?.children?.length);
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

  const renderNodes = (ns: readonly TreeNode[], depth: number) =>
    ns.map((n) => {
      const branch = Boolean(n.children?.length);
      const isOpen = branch && exp.has(n.id);
      return (
        <li
          key={n.id}
          role="treeitem"
          data-id={n.id}
          aria-expanded={branch ? isOpen : undefined}
          aria-selected={sel === n.id}
          aria-level={depth + 1}
          tabIndex={focused === n.id ? 0 : -1}
          className="noo-tree__item"
          onFocus={(e) => { if (e.target === e.currentTarget) setFocused(n.id); }}
        >
          <div className="noo-tree__row" onClick={() => { select(n.id); focusId(n.id); }}>
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
    });

  return (
    <ul ref={rootRef} role="tree" aria-label={label} className={cx("noo-tree", className)} onKeyDown={onKeyDown} {...rest}>
      {renderNodes(nodes, 0)}
    </ul>
  );
}
