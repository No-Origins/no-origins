"use server";

import { revalidatePath } from "next/cache";
import type { GridLayout } from "@no-origins/ui/lib/grid-layout";
import { supabaseServer } from "@/lib/supabase/server";
import { slugify } from "@/lib/quests";

/**
 * The quest mutations (Admin.md §0.5). Every one goes through the anon-key server client, so RLS is what actually
 * decides whether the write lands (§8.3): an editor may create and compose, only an owner may delete.
 */

export type CreateResult = { ok: true; slug: string } | { ok: false; error: string };

export async function createQuest(_prev: CreateResult | null, formData: FormData): Promise<CreateResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "A quest needs a name." };

  const slug = slugify(name);
  if (!slug) return { ok: false, error: "That name has no letters or numbers to make a slug from." };

  const supabase = await supabaseServer();
  const { error } = await supabase.from("quests").insert({ name, slug });
  if (error) {
    // 23505 is a unique violation — the slug is taken. Everything else is unexpected.
    if (error.code === "23505") return { ok: false, error: `A quest called "${slug}" already exists.` };
    return { ok: false, error: error.message };
  }

  revalidatePath("/quests");
  return { ok: true, slug };
}

export async function deleteQuest(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("quests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/quests");
  return { ok: true };
}

export type SaveResult =
  | { ok: true; rev: number }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; error: string };

/**
 * Write a quest's layout on the `rev` it was loaded at. A stale write moves zero rows — the row's rev has already
 * moved on — and comes back as a conflict rather than a silent overwrite. The trigger bumps `rev`, so the row we
 * read back carries the new one.
 */
export async function saveQuestLayout(slug: string, layout: GridLayout, rev: number): Promise<SaveResult> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("quests")
    .update({ layout })
    .eq("slug", slug)
    .eq("rev", rev)
    .select("rev")
    .maybeSingle();

  if (error) return { ok: false, conflict: false, error: error.message };
  if (!data) return { ok: false, conflict: true };
  return { ok: true, rev: (data as { rev: number }).rev };
}
