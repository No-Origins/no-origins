"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ThemeSwitch, type MenuGroup, type MenuItem } from "@no-origins/ui";
import { tokenPages } from "@/content/tokens";

/**
 * The showcase's navigation — the admin's `Menu` (Admin.md §4), reused here (2026-09-15).
 *
 * The showcase shipped in page mode with a `NavBar` of three links, which was right when there were three routes.
 * There are now eleven, and §4's own reasoning applies word for word: seven-plus destinations in a row collide, and
 * the answer is a column. So this is the `Menu` (Atomic.md D9) in the `Tool` shell the admin wears.
 *
 * **One navigation has one width** (v1, 2026-09-16). The rail form went with the glass it was made of, and the
 * collapse toggle and the per-browser memory of it went with the rail: there is nothing left to remember. `form`
 * stays at `auto`, which is the column from `md` (900) up and the bottom sheet below it — the viewport decides,
 * which is one fewer state to disagree with than a choice a person and a viewport both write to.
 *
 * **Two items, and they are the two halves of the system**: Tokens, and the Components built from them. The admin
 * puts a labelled group above each destination because each of its groups holds several; here a group would hold
 * exactly one item with the same name, and the column would read "TOKENS · All tokens · Colour" — the same word
 * three times before it says anything. So the groups are unlabelled, which also means they carry no hue: a group's
 * hue is drawn on its label's dot and nowhere else, and a hue nobody can see is a decision nobody can read.
 *
 * Naming the items for what they are rather than "All tokens" is also what makes the sheet work. The Menu falls
 * back to a label's first letter where there is no room for the label, so two items beginning "All" would be two
 * identical glyphs on a phone. Tokens and Components are T and C.
 *
 * `components` arrives from the layout rather than being read here: the registry imports every component in the
 * package, and importing it into a client island would drag all of them into the browser bundle to count to three.
 */
export function DesignMenu({ components }: { components: MenuItem[] }) {
  const pathname = usePathname();

  const groups: MenuGroup[] = [
    { items: [{ href: "/", label: "Overview" }] },
    {
      items: [
        {
          href: "/tokens",
          label: "Tokens",
          items: tokenPages.map((p) => ({ href: `/tokens/${p.slug}`, label: p.title })),
        },
      ],
    },
    { items: [{ href: "/components", label: "Components", items: components }] },
  ];

  return <Menu groups={groups} currentHref={pathname} linkComponent={Link} trailing={<ThemeSwitch />} />;
}
