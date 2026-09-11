import { Page } from "@no-origins/ui";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

// Page mode (Design-System.md §8): everything you read — About, Work, Roadmap, Contact, and the fixtures.
// The home at "/" is Canvas mode and stays outside this group: the canvas is the nav.
export default function PageModeLayout({ children }: LayoutProps<"/">) {
  return (
    <Page nav={<SiteNav />} footer={<SiteFooter />}>
      {children}
    </Page>
  );
}
