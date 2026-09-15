import type { NavLink } from "@no-origins/ui";

/**
 * The portfolio's navigation: the seven sections in reading order (Brand.md §9). Me first, because it is the
 * home; then what he made, then who he is.
 *
 * It lives in `content/` rather than beside `SiteNav` because the footer is a SERVER component and `SiteNav` is a
 * client one: a value imported out of a `"use client"` module into a server component arrives as a client
 * reference, not as the array, so `Footer` was quietly rendering no links at all.
 */
export const siteLinks: NavLink[] = [
  { href: "/", label: "Me" },
  { href: "/status", label: "Status" },
  { href: "/work", label: "Work" },
  { href: "/case-studies", label: "Cases" },
  { href: "/projects", label: "Projects" },
  { href: "/interests", label: "Interests" },
  { href: "/philosophy", label: "Philosophy" },
];
