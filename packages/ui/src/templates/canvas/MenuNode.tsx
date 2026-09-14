"use client";
import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Menu, type MenuItem } from "../../organisms/Menu";
import { useCanvasNav } from "./nav";
import type { MenuFlowNode, MenuSceneItem } from "./scene";

/**
 * MenuNode — the view switcher as a node in canvas space (Atomic.md D9, amended 2026-09-14).
 *
 * A `Menu` in its floating form: pill items at `--ctl-sm`, the current view an ink pill. It is a node like any
 * other — dragged and dropped in the editor, panned with the map, linearised in document mode — so where it sits
 * is a composition decision rather than a fixture of the shell. Items with a `view` pan (a real link is kept
 * underneath so the menu is crawlable); items with only an `href` open a page.
 */
export interface MenuNodeData extends Record<string, unknown> {
  label?: string;
  items: MenuSceneItem[];
}

export const MenuNode = memo(function MenuNode({ data }: NodeProps<MenuFlowNode>) {
  const nav = useCanvasNav();
  const items: MenuItem[] = data.items.map((it) => ({
    id: it.view ?? it.href ?? it.label,
    label: it.label,
    href: it.href,
    current: it.view ? nav?.current === it.view : undefined,
    onSelect: it.view ? () => nav?.goTo(it.view!) : undefined,
  }));
  return <Menu form="floating" aria-label={data.label ?? "Sections"} skipTo={false} brand={false} items={items} className="noo-canvas__menu" />;
});
