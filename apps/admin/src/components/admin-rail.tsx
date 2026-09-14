"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Text, ThemeSwitch, type MenuGroup } from "@no-origins/ui";

/**
 * The rail (Admin.md §4) — a `Menu` (Atomic.md D9): column on a desktop, rail between `sm` and `md`, sheet below.
 *
 * The groups ARE the three layers, in the order of dependence — Projects → Systems ← Products — which is why
 * Overview sits outside them rather than becoming a fourth. Each group's hue carries its layer, so §1's claim is
 * visible in the navigation and not only in the eyebrow each screen prints.
 *
 * On the editor route (`…/edit`, Admin.md §6.5 row 1) it takes its rail form whatever the width, so the screen's
 * sidebar and inspector have the room; the theme switch that the rail hides sits in the editor's own bar.
 *
 * A client island purely because it needs the pathname.
 */
export const GROUPS: MenuGroup[] = [
  { items: [{ href: "/", label: "Overview" }] },
  {
    label: "Projects",
    hue: "peach",
    items: [{ href: "/projects", label: "All projects", items: [{ href: "/projects/portfolio", label: "Portfolio" }] }],
  },
  {
    label: "Systems",
    hue: "lavender",
    items: [
      {
        href: "/systems",
        label: "All systems",
        items: [
          { href: "/systems/design", label: "Design System" },
          { href: "/systems/document", label: "Document" },
          { href: "/systems/publishing", label: "Publishing" },
          { href: "/systems/storage", label: "Storage" },
        ],
      },
    ],
  },
  { label: "Products", hue: "blue", items: [{ href: "/products", label: "All products" }] },
];

export function AdminRail({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const editing = /\/edit(\/|$)/.test(pathname);
  return (
    <Menu
      groups={GROUPS}
      form={editing ? "rail" : "auto"}
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
