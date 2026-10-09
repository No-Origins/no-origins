import { ASSETS, ENTRIES } from "@cinema/content";

import { Home } from "@/components/home";
import { makeLibrary } from "@/engine/library";

/**
 * The Cinema Studio's home (Cinema.md F11; his, 2026-10-09: "we shall create a homepage for Cinema Studio, and the
 * first section will be assets"): its sections, Assets first, each asset a card that opens its bench.
 */
export default function Page() {
  const library = makeLibrary(ENTRIES);
  const assets = ASSETS.flatMap((id) => {
    const entry = library.latest(id);
    return entry ? [{ id: entry.id, label: entry.label, description: entry.description, version: entry.version, controls: entry.controls.length }] : [];
  });
  return <Home assets={assets} />;
}
