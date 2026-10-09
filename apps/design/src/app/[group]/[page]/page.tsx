import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocPageView } from "@/components/doc-page";
import { DOC_ENTRIES, findDoc } from "@/content/sitemap";

/** Every page the sidebar lists, built ahead; any other address is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_ENTRIES.map((entry) => ({ group: entry.group.id, page: entry.page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[group]/[page]">): Promise<Metadata> {
  const { group, page } = await params;
  const entry = findDoc(group, page);
  return { title: entry ? `${entry.page.title} · ${entry.group.title}` : "Not found" };
}

export default async function DocPage({ params }: PageProps<"/[group]/[page]">) {
  const { group, page } = await params;
  if (!findDoc(group, page)) notFound();
  return <DocPageView groupId={group} pageSlug={page} />;
}
