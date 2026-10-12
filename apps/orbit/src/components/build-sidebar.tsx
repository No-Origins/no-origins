"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, CameraIcon, CircleDotIcon, Grid3x3Icon, MapIcon, MountainIcon, type LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@no-origins/ui/components/sidebar";
import { Text } from "@no-origins/ui/components/text";

/**
 * The builder's sidebar (his: "We need Sidebar Menu we have"), the design system's `Sidebar` floating over the world:
 * the World first, its boundaries, since everything else is inside it (World.md W29), Environment, Camera and Map, then
 * Elements, the things that stand in the world: Portal its first, then the Sector the
 * world stands on, made of zones (his: "In elements, add controls for the plane", then "let's call it sector"). Each
 * item is a jig's page (World.md W14). Folded, it keeps its icons, each named in a tooltip; on a phone it is a sheet, opened by the
 * button at the top left.
 */
type Item = { href: string; label: string; icon: LucideIcon };

const WORLD: readonly Item[] = [
  { href: "/build/world", label: "World", icon: BoxIcon },
  { href: "/build/environment", label: "Environment", icon: MountainIcon },
  { href: "/build/camera", label: "Camera", icon: CameraIcon },
  { href: "/build/map", label: "Map", icon: MapIcon },
];

const ELEMENTS: readonly Item[] = [
  { href: "/build/portal", label: "Portal", icon: CircleDotIcon },
  { href: "/build/sector", label: "Sector", icon: Grid3x3Icon },
];

export function BuildSidebar() {
  const pathname = usePathname();
  const items = (list: readonly Item[]) => (
    <SidebarMenu>
      {list.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton asChild isActive={pathname.startsWith(href)} tooltip={label}>
            <Link href={href}>
              <Icon />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <>
      <Sidebar variant="floating" collapsible="icon" className="pointer-events-auto">
        <SidebarHeader className="flex-row items-center gap-inline">
          <SidebarTrigger />
          <Text role="label" as="span" className="group-data-[collapsible=icon]:hidden">Builder</Text>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>{items(WORLD)}</SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Elements</SidebarGroupLabel>
            {items(ELEMENTS)}
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      {/* On a phone the sidebar is a sheet: this opens it. */}
      <SidebarTrigger variant="outline" className="pointer-events-auto fixed top-4 left-4 z-10 bg-background md:hidden" />
    </>
  );
}
