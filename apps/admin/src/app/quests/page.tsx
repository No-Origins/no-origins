import { QuestsGrid } from "@/components/quests-grid";
import { listQuests } from "@/lib/quests";
import { currentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Quests" };

/**
 * The quests dashboard (Admin.md §0.5). RLS decides what `listQuests` returns; the owner is the one who may delete,
 * so `canDelete` is a hint for the UI, not the boundary — the `quests_delete` policy is (§8.3).
 */
export default async function QuestsPage() {
  const [quests, profile] = await Promise.all([listQuests(), currentProfile()]);
  return <QuestsGrid quests={quests} canDelete={profile?.role === "owner"} />;
}
