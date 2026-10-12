import { SidebarProvider } from "@no-origins/ui/components/sidebar";
import { TooltipProvider } from "@no-origins/ui/components/tooltip";

import { BuildSidebar } from "@/components/build-sidebar";

/**
 * The builder (World.md W14): the sidebar over the world, and the page of the jig it is on. The world itself is drawn
 * by the root layout, under everything, and stays through every page.
 */
export default function BuildLayout({ children }: LayoutProps<"/build">) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <BuildSidebar />
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
}
