import { Page } from "@no-origins/ui";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

// Page mode (Design-System.md §8): the whole site now. The canvas that used to hold the home went with React
// Flow on 2026-09-16, so "/" reads in this layout too and the NavBar is the only navigation there is.
export default function PageModeLayout({ children }: LayoutProps<"/">) {
  return (
    <Page nav={<SiteNav />} footer={<SiteFooter />}>
      {children}
    </Page>
  );
}
