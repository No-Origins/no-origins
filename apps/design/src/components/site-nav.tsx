"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavBar, ThemeSwitch } from "@no-origins/ui";

export const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/components", label: "Components" },
  { href: "/tokens", label: "Tokens" },
];

/** The bar, with `aria-current` on where you are. A client island only because it needs the pathname. */
export function SiteNav() {
  const pathname = usePathname();
  return <NavBar links={LINKS} currentHref={pathname} linkComponent={Link} trailing={<ThemeSwitch />} />;
}
