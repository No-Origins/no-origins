import { notFound } from "next/navigation";
import { getQuest } from "@/lib/quests";
import { QuestComposer } from "@/components/quest-composer";

export async function generateMetadata({ params }: PageProps<"/quests/[slug]">) {
  const { slug } = await params;
  const quest = await getQuest(slug);
  return { title: quest ? quest.name : "Quest" };
}

/**
 * The compose dashboard for one quest (Admin.md §0.5). RLS gates the read; a slug that returns nothing — missing,
 * or not one this role may see — is a 404 rather than an empty editor.
 */
export default async function QuestPage({ params }: PageProps<"/quests/[slug]">) {
  const { slug } = await params;
  const quest = await getQuest(slug);
  if (!quest) notFound();
  return <QuestComposer quest={quest} />;
}
