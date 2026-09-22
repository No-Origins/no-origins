"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeToggle } from "@no-origins/ui/components/theme-provider";
import { MoonIcon, PenToolIcon, SunIcon } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

const ROUTES = [
  { href: "/", label: "Overview" },
  { href: "/atoms", label: "Atoms" },
  { href: "/molecules", label: "Molecules" },
  { href: "/composer", label: "Composer" },
];

/**
 * The one piece of chrome. Sticky, so the layer you are reading is always named.
 *
 * Every page has a Compose button (Grid.md D17): it opens the composer on this page's layout. Always shown — the
 * showcase has no auth and no database, and the composer changes nothing until its export is pasted into code.
 */
export function ShowcaseNav() {
  const pathname = usePathname();
  // Through the grid's flip when a grid is on the page (Grid.md D28), like the `d` key.
  const toggleTheme = useThemeToggle();

  // h-14 sits on the header itself, border included (border-box), so the bar is exactly 3.5rem tall and
  // `calc(100dvh - 3.5rem)` on every page is exact. With h-14 on the inner div the border added a 1px page scroll.
  return (
    <header className="bg-background/80 sticky top-0 z-50 h-14 border-b backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center gap-3 px-6 sm:gap-6">
        <Text role="label" as="span" className="shrink-0">
          No Origins
        </Text>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {ROUTES.map((route) => (
            <Button
              key={route.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(pathname === route.href && "bg-muted text-foreground")}
            >
              <Link href={route.href}>{route.label}</Link>
            </Button>
          ))}
        </nav>
        {pathname !== "/composer" ? (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/composer?from=${encodeURIComponent(pathname)}`}>
              <PenToolIcon data-icon="inline-start" /> Compose
            </Link>
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="block dark:hidden" />
        </Button>
      </div>
    </header>
  );
}
