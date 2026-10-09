import type { Metadata } from "next";

import { EntryPage, entryTitle } from "@/components/entry-page";

// The bench is read from disk at each visit: it changes as he plays with it.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/effect/[id]">): Promise<Metadata> {
  return { title: entryTitle((await params).id) };
}

/** An effect of the Effects section on its page, as an asset is on its own (Cinema.md F11, Cinema-Engine.md E1). */
export default async function Page({ params }: PageProps<"/effect/[id]">) {
  return <EntryPage section="effects" id={(await params).id} />;
}
