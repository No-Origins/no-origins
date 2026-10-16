"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { BoxIcon, CameraIcon, CloudIcon, CloudyIcon, GlobeIcon, HazeIcon, MapIcon, MountainIcon, PersonStandingIcon, SunIcon, SunMediumIcon, type LucideIcon } from "lucide-react";

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

import { fullView } from "@/world/full-view";

/**
 * The builder's sidebar (his: "We need Sidebar Menu we have"; World.md W14, W73), the design system's `Sidebar`
 * floating over the world: **World** first, the world as the sectors build it (W82), since everything else is inside it
 * (W29, W73); **Spaces**, where the world's spatial units are made (W81; his: "create another section called Spaces"):
 * Sectors, a sector's place and size and what it holds (W91: no zones), and habitats and ecosystems beside it when he wants them;
 * **Environment**, a page a group of the atmosphere (his: "under environment we should have clouds,
 * camera, map, and base clouds, light and texture, fog, individually to configure", and a Sky page of their own):
 * Sky, Clouds (the ceiling, W38), Camera, Map, Base clouds, Light and texture, Fog; then **Elements**, each a page
 * of the element alone with its variants (his: "I want mountains … and a dropdown of variants"): Mountains and Human
 * (the Sector left for Spaces, W81; the Portal went, and a block's, a tree's, a pipe's and a road's look is set as it is
 * placed on the Sectors page, W93). Folded, it keeps its icons, each named in a tooltip; on a phone it is a sheet,
 * opened by the button at the top left. In the World page's full view (W105) it is put away, the phone's button too.
 */
type Item = { href: string; label: string; icon: LucideIcon };

const WORLD: readonly Item[] = [{ href: "/build/world", label: "World", icon: GlobeIcon }];

const SPACES: readonly Item[] = [{ href: "/build/sectors", label: "Sectors", icon: BoxIcon }];

const ENVIRONMENT: readonly Item[] = [
  { href: "/build/sky", label: "Sky", icon: SunIcon },
  { href: "/build/clouds", label: "Clouds", icon: CloudIcon },
  { href: "/build/camera", label: "Camera", icon: CameraIcon },
  { href: "/build/map", label: "Map", icon: MapIcon },
  { href: "/build/base-clouds", label: "Base clouds", icon: CloudyIcon },
  { href: "/build/light", label: "Light and texture", icon: SunMediumIcon },
  { href: "/build/fog", label: "Fog", icon: HazeIcon },
];

const ELEMENTS: readonly Item[] = [
  { href: "/build/mountains", label: "Mountains", icon: MountainIcon },
  { href: "/build/human", label: "Human", icon: PersonStandingIcon },
];

export function BuildSidebar() {
  const pathname = usePathname();
  const full = useSyncExternalStore(fullView.subscribe, fullView.get, fullView.start);
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

  if (full) return null;
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
            <SidebarGroupLabel>Spaces</SidebarGroupLabel>
            {items(SPACES)}
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Environment</SidebarGroupLabel>
            {items(ENVIRONMENT)}
          </SidebarGroup>
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
