import { Menu, type MenuGroup, type MenuItem, type MenuProps } from "./Menu";

/**
 * @deprecated Folded into `Menu` (Atomic.md D9, 2026-09-14): `<Rail groups>` is `<Menu groups>` — same groups, same
 * one level of nesting, same skip link; the current marker is now the ink pill. This alias goes with the next minor.
 */
export type RailItem = MenuItem;
export type RailGroup = MenuGroup;
export interface RailProps extends Omit<MenuProps, "form" | "items" | "groups"> {
  groups: MenuGroup[];
}

/** @deprecated Use `<Menu groups={…}>`. */
export function Rail(props: RailProps) {
  return <Menu {...props} />;
}
