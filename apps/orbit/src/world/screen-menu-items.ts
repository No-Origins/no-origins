/**
 * The screen's three button cells, left to right (World.md W112). Only Portfolio is his so far; the other two are
 * drawn inert, unlabelled, until he names them. An item with a page loads that page on the screen.
 */
export type ScreenMenuItem = { id: string; label?: string; page?: string };

export const SCREEN_MENU: readonly ScreenMenuItem[] = [
  { id: "portfolio", label: "Portfolio", page: "https://hiddenstack.no-origins.com" },
  { id: "second" },
  { id: "third" },
];

/** The canvas announces the menu's state with this event; the page's hidden buttons answer focus with the next one. */
export const SCREEN_MENU_SHOWN = "orbit-screen-menu";
export const SCREEN_MENU_FOCUS = "orbit-screen-menu-focus";
/** On the canvas: the item whose page the screen shows, by id, or null to close it. */
export const SCREEN_PAGE = "orbit-screen-page";
/** On the canvas: where the open page sits in the canvas, once the camera faces the screen; null when it closes. */
export const SCREEN_PAGE_RECT = "orbit-screen-page-rect";

type Box = { x: number; y: number; w: number; h: number };
export type ScreenPageRect = { frame: Box; page: Box };

export function openScreenPage(host: HTMLElement, item: ScreenMenuItem | null) {
  if (item && !item.page) return;
  host.dispatchEvent(new CustomEvent(SCREEN_PAGE, { detail: item?.id ?? null }));
}
