import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ASSETS, ENTRIES } from "@cinema/content";

import { AssetBench } from "@/components/bench";
import { isId, readBench } from "@/data/store";
import { benchFor } from "@/engine/bench";
import { makeLibrary } from "@/engine/library";

// The bench is read from disk at each visit: it changes as he plays with it.
export const dynamic = "force-dynamic";

const library = makeLibrary(ENTRIES);
const benchOf = (id: string) => (isId(id) && ASSETS.includes(id) ? benchFor(id, readBench(id), library) : undefined);

export async function generateMetadata({ params }: PageProps<"/asset/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: library.latest(id)?.label ?? "Asset" };
}

/** An asset of the Assets section on its bench (Cinema.md F11, Cinema-Engine.md E1). */
export default async function Page({ params }: PageProps<"/asset/[id]">) {
  const { id } = await params;
  const bench = benchOf(id);
  if (!bench) notFound();
  return <AssetBench initial={bench} title={library.latest(id)!.label} />;
}
