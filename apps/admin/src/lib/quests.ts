import type { GridLayout } from "@no-origins/ui/lib/grid-layout";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Quests — the admin's one first-class thing (Admin.md §0.5).
 *
 * A quest is a surface deployed as its own subdomain, composed on the grid. Its `layout` is a `GridLayout` — the
 * same pure model the grid renders and the editor mutates — so what the dashboard saves is what a quest ships.
 * Reads go through the anon-key server client and RLS decides what comes back (§8.3); there is no service role here.
 */

export type QuestStatus = "draft" | "live" | "archived";

export type Quest = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subdomain: string | null;
  hue: string | null;
  status: QuestStatus;
  layout: GridLayout | null;
  rev: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, slug, name, description, subdomain, hue, status, layout, rev, created_at, updated_at";

export async function listQuests(): Promise<Quest[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("quests").select(COLUMNS).order("created_at", { ascending: true });
  return (data as Quest[] | null) ?? [];
}

export async function getQuest(slug: string): Promise<Quest | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("quests").select(COLUMNS).eq("slug", slug).maybeSingle();
  return (data as Quest | null) ?? null;
}

/**
 * A slug from a name: lower-case, non-alphanumerics to single hyphens, trimmed. Matches the table's
 * `^[a-z0-9]+(-[a-z0-9]+)*$` check, or returns "" when the name has nothing usable in it.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
