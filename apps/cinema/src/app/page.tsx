import { ENTRIES } from "@cinema/content";

import { Home, type HomeSection } from "@/components/home";
import { makeLibrary } from "@/engine/library";
import { SECTIONS } from "@/lib/sections";

/**
 * The Cinema Studio's home (Cinema.md F11; his, 2026-10-09: "we shall create a homepage for Cinema Studio, and the
 * first section will be assets"): its sections, Assets first, then Effects, each entry a card that opens its page. A
 * section with no entries is left out, but Assets, which says it has none. `?section=` opens on that section's page.
 */
export default async function Page({ searchParams }: PageProps<"/">) {
  const { section } = await searchParams;
  const library = makeLibrary(ENTRIES);
  const sections: HomeSection[] = SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    path: s.path,
    cards: s.entries.flatMap((id) => {
      const entry = library.latest(id);
      return entry ? [{ id: entry.id, label: entry.label, description: entry.description, version: entry.version, controls: entry.controls.length }] : [];
    }),
  })).filter((s) => s.id === "assets" || s.cards.length);
  return <Home sections={sections} section={typeof section === "string" ? section : undefined} />;
}
