import Link from "next/link";
import { Footer, ThemeSwitch } from "@no-origins/ui";
import { siteLinks } from "@/content/nav";

export function SiteFooter() {
  return <Footer links={siteLinks} linkComponent={Link} meta="bhargav.no-origins.com" trailing={<ThemeSwitch />} />;
}
