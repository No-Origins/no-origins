"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Text, ThemeSwitch, type MenuGroup } from "@no-origins/ui";

/**
 * The admin's navigation (Admin.md §4) — a `Menu` (Atomic.md D9) in its `auto` form: a column from `md` up, the
 * sheet below it. One navigation, one width; the collapsing rail went with v1 of the package.
 *
 * The groups ARE the three layers, in the order of dependence — Projects → Systems ← Products — which is why
 * Overview sits outside them rather than becoming a fourth. Each group's hue carries its layer, so §1's claim is
 * visible in the navigation and not only in the eyebrow each screen prints.
 *
 * A client island because it needs the pathname to mark the current item.
 */
export const GROUPS: MenuGroup[] = [
  { items: [{ href: "/", label: "Overview" }] },
  {
    label: "Projects",
    hue: "peach",
    items: [{ href: "/projects", label: "Projects", items: [{ href: "/projects/portfolio", label: "Portfolio" }] }],
  },
  {
    label: "Systems",
    hue: "lavender",
    items: [
      {
        href: "/systems",
        label: "Systems",
        items: [
          { href: "/systems/design", label: "Design System" },
          { href: "/systems/document", label: "Document" },
          { href: "/systems/publishing", label: "Publishing" },
          { href: "/systems/storage", label: "Storage" },
        ],
      },
    ],
  },
  { label: "Products", hue: "blue", items: [{ href: "/products", label: "Products" }] },
];

export function AdminMenu({ email }: { email?: string | null }) {
  const pathname = usePathname();
  return (
    <Menu
      groups={GROUPS}
      currentHref={pathname}
      linkComponent={Link}
      trailing={
        <>
          <ThemeSwitch />
          {email ? (
            <form action="/auth/sign-out" method="post">
              <Text size="small" tone="muted" className="noo-menu__who" title={email}>{email}</Text>
              <button type="submit" className="noo-menu__link">Sign out</button>
            </form>
          ) : null}
        </>
      }
    />
  );
}
