"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@no-origins/ui/components/sidebar";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import type { GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import type { SpecimenItem } from "@/content";
import { docAt, SITEMAP } from "@/content/sitemap";
import { BAND } from "@/lib/arrange";

/**
 * The showcase's sidebar: four columns on the left of every page, kept there through every turn as the layout's
 * fixtures (Grid.md D51). Row 1 is the system's name in a bordered box; under it, one bordered box holding the
 * sitemap (`content/sitemap.ts`): the ten groups, each a collapsible list of its pages, Components a list of
 * categories that collapse in turn. One group is open at a time, and one category. Every row is 36px, the system's
 * one control height. The box is as tall as its rows in whole cells, as far as the field has room; beyond that the
 * list scrolls inside it (Grid.md D52), its place shown by the liquid in the cursor, and it brings the current page
 * into view. A field too narrow to keep the sidebar beside a page (under `SIDEBAR_MIN_COLS`) shows it as the first
 * page instead.
 */

/** The design system's name. */
export const SYSTEM_NAME = "Circles";

/** The sidebar's width in columns. */
export const SIDEBAR_COLS = 4;

/** The sidebar, its column of air, and the narrowest band a page is shown in (a phone's, six). */
export const SIDEBAR_MIN_COLS = SIDEBAR_COLS + 1 + 6;

/** What the pages keep clear on the left: the sidebar and a column of air (a cell of air between blocks). */
export const SIDEBAR_LEFT = SIDEBAR_COLS + 1;

/** One row of the list: the system's control height. */
const ROW = 36;
/** The list box's inset, the `inset-tight` job (Spacing.md SP3), and its hairline. */
const INSET = 12;
const BORDER = 1;

const NAME_ID = "sidebar-name";
const NAV_ID = "sidebar-nav";

// ── what is open ──────────────────────────────────────────────────────────────────────────────────────────────

type NavState = {
  /** The open group, and the open category in it. */
  group: string | null;
  category: string | null;
};

const groupKey = (id: string) => `g:${id}`;
const categoryKey = (group: string, id: string) => `c:${group}/${id}`;

function stateFor(pathname: string): NavState {
  const entry = docAt(pathname);
  return { group: entry?.group.id ?? null, category: entry?.category?.id ?? null };
}

type NavContextValue = { state: NavState; setState: React.Dispatch<React.SetStateAction<NavState>>; pathname: string };
const NavContext = React.createContext<NavContextValue | null>(null);

/** Holds what is open across routes; a new route opens its own group (and category). */
export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = React.useState<NavState>(() => stateFor(pathname));
  const [path, setPath] = React.useState(pathname);
  if (path !== pathname) {
    setPath(pathname);
    setState(stateFor(pathname));
  }
  const value = React.useMemo(() => ({ state, setState, pathname }), [state, pathname]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

function useNav() {
  const nav = React.useContext(NavContext);
  if (!nav) throw new Error("The sidebar needs SidebarStateProvider above it (app/layout.tsx).");
  return nav;
}

// ── the rows ──────────────────────────────────────────────────────────────────────────────────────────────────

type NavRow = {
  key: string;
  depth: 0 | 1 | 2;
  kind: "group" | "category" | "page";
  label: string;
  href?: string;
  open?: boolean;
  group: string;
  category?: string;
  /** The keys of the rows above it in the tree, outermost first. */
  parents: string[];
};

/** The rows the open groups and category show, in order. */
function visibleRows(state: NavState): NavRow[] {
  const rows: NavRow[] = [];
  for (const group of SITEMAP) {
    const gk = groupKey(group.id);
    const open = state.group === group.id;
    rows.push({ key: gk, depth: 0, kind: "group", label: group.title, open, group: group.id, parents: [] });
    if (!open) continue;
    for (const page of group.pages ?? []) {
      const href = `/${group.id}/${page.slug}`;
      rows.push({ key: href, depth: 1, kind: "page", label: page.title, href, group: group.id, parents: [gk] });
    }
    for (const category of group.categories ?? []) {
      const ck = categoryKey(group.id, category.id);
      const catOpen = state.category === category.id;
      rows.push({ key: ck, depth: 1, kind: "category", label: category.title, open: catOpen, group: group.id, category: category.id, parents: [gk] });
      if (!catOpen) continue;
      for (const page of category.pages) {
        const href = `/${group.id}/${page.slug}`;
        rows.push({ key: href, depth: 2, kind: "page", label: page.title, href, group: group.id, category: category.id, parents: [gk, ck] });
      }
    }
  }
  return rows;
}

/** How many rows a list box `rows` cells tall holds. */
function capacity(rows: number, cell: number, gap: number) {
  return Math.floor((rows * cell + (rows - 1) * gap - 2 * INSET - 2 * BORDER) / ROW);
}

/** The cells the list box takes: as few as hold every open row, at most `max` (then it pages). */
function listRows(count: number, max: number, cell: number, gap: number) {
  for (let rows = 1; rows < max; rows += 1) if (capacity(rows, cell, gap) >= count) return rows;
  return Math.max(1, max);
}

/** The sidebar's height in cells under the name: the list box's, for the rows now open. */
export function useSidebarListRows(max: number, cell: number, gap: number) {
  const { state } = useNav();
  return listRows(visibleRows(state).length, max, cell, gap);
}

// ── on the grid ───────────────────────────────────────────────────────────────────────────────────────────────

/** The sidebar as fixtures on a wide field: the name on row 1 and the list under it, `listRowsCount` cells tall. */
export function sidebarFixtures(listRowsCount: number): GridLayoutItem[] {
  return [
    { id: NAME_ID, col: 1, row: 1, colSpan: SIDEBAR_COLS, rowSpan: 1 },
    { id: NAV_ID, col: 1, row: 2, colSpan: SIDEBAR_COLS, rowSpan: listRowsCount },
  ];
}

/** The same two boxes as specimens, for a narrow field, where they are the first page, as wide as its band. */
export function sidebarItems(listRowsCount: number): SpecimenItem[] {
  return [
    { id: NAME_ID, span: { base: { cols: BAND, rows: 1 } }, variant: "none", render: () => <SystemName /> },
    { id: NAV_ID, span: { base: { cols: BAND, rows: listRowsCount } }, variant: "none", render: () => <SitemapList /> },
  ];
}

/** Draws a sidebar box by its id, or nothing when the id is not the sidebar's. */
export function renderSidebar(placed: GridLayoutItem) {
  if (placed.id === NAME_ID) return <SystemName />;
  if (placed.id === NAV_ID) return <SitemapList />;
  return null;
}

/** The first row: the system's name, in a bordered box. */
function SystemName() {
  return (
    <Slot fill="card" inset="inset-pill" alignY="center">
      <Text role="heading" as="p" className="truncate">
        {SYSTEM_NAME}
      </Text>
    </Slot>
  );
}

const INDENT: Record<NavRow["depth"], string> = { 0: "ps-3", 1: "ps-7", 2: "ps-11" };

/** The list: the open rows, scrolling inside the box when they are more than it holds, the current page in view. */
function SitemapList() {
  const { state, setState, pathname } = useNav();
  const list = React.useRef<HTMLUListElement>(null);
  const rows = visibleRows(state);

  // Bring the current page into view when it changes; the box scrolls, the page never does.
  React.useEffect(() => {
    list.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  const toggle = (row: NavRow) =>
    setState((s) =>
      row.kind === "group"
        ? { group: s.group === row.group ? null : row.group, category: s.group === row.group ? null : s.category }
        : { ...s, category: s.category === row.category ? null : (row.category ?? null) },
    );

  return (
    <Slot fill="card" inset={0}>
      <SidebarProvider className="h-full min-h-0">
        <ScrollArea className="size-full">
          <nav aria-label={SYSTEM_NAME} className="p-inset-tight">
            <SidebarMenu ref={list} className="gap-0">
              {rows.map((row) => (
                <SidebarMenuItem key={row.key}>
                  {row.kind === "page" ? (
                    <SidebarMenuButton
                      asChild
                      isActive={row.href === pathname}
                      className={`${INDENT[row.depth]} text-muted-foreground data-[active=true]:text-foreground hover:text-foreground`}
                    >
                      <Link href={row.href as string} aria-current={row.href === pathname ? "page" : undefined}>
                        <span>{row.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton aria-expanded={row.open} onClick={() => toggle(row)} className={INDENT[row.depth]}>
                      <span className="min-w-0 flex-1 truncate">{row.label}</span>
                      <ChevronRightIcon aria-hidden className={`text-muted-foreground transition-transform ${row.open ? "rotate-90" : ""}`} />
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </nav>
        </ScrollArea>
      </SidebarProvider>
    </Slot>
  );
}
