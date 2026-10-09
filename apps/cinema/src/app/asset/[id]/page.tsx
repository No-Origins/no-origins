import type { Metadata } from "next";

import { EntryPage, entryTitle } from "@/components/entry-page";

// The bench is read from disk at each visit: it changes as he plays with it.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/asset/[id]">): Promise<Metadata> {
  return { title: entryTitle((await params).id) };
}

/** An asset of the Assets section on its page (Cinema.md F11, Cinema-Engine.md E1). */
export default async function Page({ params }: PageProps<"/asset/[id]">) {
  return <EntryPage section="assets" id={(await params).id} />;
}
