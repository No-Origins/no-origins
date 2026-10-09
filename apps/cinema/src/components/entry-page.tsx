import { notFound } from "next/navigation";
import { ENTRIES } from "@cinema/content";

import { AssetBench } from "@/components/bench";
import { isId, readAssets, readBench } from "@/data/store";
import { benchFor, configurationsOf } from "@/engine/bench";
import { makeLibrary } from "@/engine/library";
import { sectionOf, type SectionId } from "@/lib/sections";

const library = makeLibrary(ENTRIES);

/** The label of an entry of a home section, for the page's title. */
export const entryTitle = (id: string) => library.latest(id)?.label ?? "Cinema";

/**
 * An entry of a home section on its page (Cinema.md F11, Cinema-Engine.md E1): an asset at `/asset/<id>`, an effect
 * at `/effect/<id>`, each read from disk at each visit, as he plays with it. Not found for an id not in that section.
 */
export function EntryPage({ section, id }: { section: SectionId; id: string }) {
  const home = sectionOf(id);
  const bench = isId(id) && home?.id === section ? benchFor(id, readBench(id), library) : undefined;
  if (!home || !bench) notFound();
  return <AssetBench initial={bench} title={library.latest(id)!.label} section={home} configurations={configurationsOf(readAssets(), id, library)} />;
}
