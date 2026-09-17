"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { cn } from "@no-origins/ui/lib/utils";

const ROUTES = [
  { href: "/", label: "Overview" },
  { href: "/atoms", label: "Atoms" },
  { href: "/molecules", label: "Molecules" },
  { href: "/grid", label: "Grid" },
];

/** The one piece of chrome. Sticky, so the layer you are reading is always named. */
export function ShowcaseNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  // h-14 sits on the header itself, border included (border-box), so the bar is exactly 3.5rem tall and
  // `calc(100dvh - 3.5rem)` on /grid is exact. With h-14 on the inner div the border added a 1px page scroll.
  return (
    <header className="bg-background/80 sticky top-0 z-50 h-14 border-b backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center gap-3 px-6 sm:gap-6">
        <span className="font-heading shrink-0 text-xs font-bold tracking-widest uppercase">No Origins</span>
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
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="block dark:hidden" />
        </Button>
      </div>
    </header>
  );
}
