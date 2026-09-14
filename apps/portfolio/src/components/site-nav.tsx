"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavBar, type NavLink } from "@no-origins/ui";

// The portfolio's navigation: the four v1 blocks (Brand.md §11 decision 5). The package's NavBar knows nothing
// about Next; this wrapper hands it the router's Link and the current pathname (§11.2 rule 1).
export const siteLinks: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const pathname = usePathname();
  return <NavBar links={siteLinks} currentHref={pathname} linkComponent={Link} />;
}
