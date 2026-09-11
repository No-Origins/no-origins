"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rail, Text, ThemeSwitch, type RailGroup } from "@no-origins/ui";

/**
 * The rail (Admin.md §4).
 *
 * The groups ARE the three layers, in the order of dependence — Projects → Systems ← Products — which is why
 * Overview sits outside them rather than becoming a fourth. Each group's hue carries its layer, so §1's claim is
 * visible in the navigation and not only in the eyebrow each screen prints.
 *
 * A client island purely because it needs the pathname.
 */
export const GROUPS: RailGroup[] = [
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
  return (
    <Rail
      groups={GROUPS}
      currentHref={pathname}
      linkComponent={Link}
      trailing={
        <>
          <ThemeSwitch />
          {email ? (
            <form action="/auth/sign-out" method="post">
              {/* padded to the links' own inset so the column has one left edge, not two */}
              <Text size="small" tone="muted" className="truncate px-3" title={email}>{email}</Text>
              <button type="submit" className="noo-rail__link w-full">Sign out</button>
            </form>
          ) : null}
        </>
      }
    />
  );
}
