"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavBar } from "@no-origins/ui";
import { siteLinks } from "@/content/nav";

// The package's NavBar knows nothing about Next; this wrapper hands it the router's Link and the current
// pathname (§11.2 rule 1). Below md it moves the same seven links into a sheet at the bottom of the viewport.
export function SiteNav() {
  const pathname = usePathname();
  return <NavBar links={siteLinks} currentHref={pathname} linkComponent={Link} />;
}
