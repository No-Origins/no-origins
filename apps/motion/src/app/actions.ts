"use server";

import { supabaseEnv } from "@no-origins/auth/env";
import { supabaseServer } from "@no-origins/auth/server";
import type { MotionState } from "@no-origins/ui/lib/motion-states";

import { checkState } from "@/lib/states";

/**
 * The agent's motions, in the admin's database (Motion.md M20, "Versions and publishing"; the tables are
 * `supabase/migrations/…_studio_versions.sql`): each motion an item of kind `motion`, made for the agent's character,
 * with one draft and its published versions. Server functions, as the character studio's are: the signed-in person's
 * session, and RLS deciding what they may do — his only. Each checks someone is signed in, since a server function can
 * be reached by a POST from anywhere.
 *
 * - **A draft** is the motion as it stands, saved whole on the `rev` it was loaded at: another device's save first is
 *   refused, not merged. A motion it places is held by its item's id, linked (M19).
 * - **Publishing** pins every motion it places to that motion's current version (his: "a published motion should
 *   freeze"), then makes the draft a version: the next number, with the name he typed, never changed afterwards. A
 *   motion that places one never published is not published until that one is.
 * - **A published motion stays**: its versions keep it (`on delete restrict`). One never published can be deleted.
 *
 * With no Supabase keys every call says `offline`, and the studio keeps its motions in the browser, as M19 did.
 */

/** The character the motions are made for: Bali, the Guide (Agents.md), stored as the character studio stores it. */
const CHARACTER = "Bali";

export type MotionVersion = { id: string; number: number; label: string; publishedAt: string };

export type SavedMotion = {
  state: MotionState;
  /** The draft's `rev` as loaded: the next save names it. */
  rev: number;
  /** Newest first. */
  versions: MotionVersion[];
  /** The version pages would play. */
  currentId: string | null;
};

export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "offline" | "signed-out" | "conflict" | "refused"; message: string };

const offline = { ok: false, reason: "offline", message: "Saved in this browser only: this server has no database keys." } as const;
const signedOut = { ok: false, reason: "signed-out", message: "Sign in to save." } as const;
const refused = (message: string) => ({ ok: false, reason: "refused", message }) as const;
const conflict = {
  ok: false,
  reason: "conflict",
  message: "This motion was changed somewhere else since it was loaded. Load it to carry on from there.",
} as const;

async function database() {
  if (!supabaseEnv()) return { error: offline } as const;
  const db = await supabaseServer();
  const { data } = await db.auth.getUser();
  if (!data.user) return { error: signedOut } as const;
  return { db } as const;
}

type Db = Awaited<ReturnType<typeof supabaseServer>>;

/** What a draft keeps of a motion: all of it but its id and name, which are its item's. */
function stored(state: MotionState) {
  const rest: Partial<MotionState> = { ...state };
  delete rest.id;
  delete rest.name;
  return rest;
}

async function character(db: Db): Promise<{ id: string } | { error: ReturnType<typeof refused> }> {
  const item = await db.from("studio_items").select("id").eq("kind", "character").eq("name", CHARACTER).maybeSingle();
  if (item.error) return { error: refused(item.error.message) };
  if (!item.data) return { error: refused(`There is no character named ${CHARACTER} that this account may see.`) };
  return { id: item.data.id };
}

/** The motions made for the agent, oldest first, each with its draft and versions. */
async function readAll(db: Db, only?: string): Promise<Outcome<SavedMotion[]>> {
  const agent = await character(db);
  if ("error" in agent) return agent.error;
  let query = db.from("studio_items").select("id, name, current_version_id, created_at").eq("kind", "motion").eq("character_id", agent.id);
  if (only) query = query.eq("id", only);
  const items = await query.order("created_at", { ascending: true });
  if (items.error) return refused(items.error.message);
  const ids = items.data.map((i) => i.id);
  if (!ids.length) return { ok: true, value: [] };
  const [drafts, versions] = await Promise.all([
    db.from("studio_drafts").select("item_id, data, rev").in("item_id", ids),
    db.from("studio_versions").select("id, item_id, number, label, published_at").in("item_id", ids).order("number", { ascending: false }),
  ]);
  if (drafts.error) return refused(drafts.error.message);
  if (versions.error) return refused(versions.error.message);
  const motions = items.data.flatMap((item): SavedMotion[] => {
    const draft = drafts.data.find((d) => d.item_id === item.id);
    const state = checkState(draft?.data, item.id, item.name);
    if (!state) return [];
    return [{
      state,
      rev: draft!.rev,
      versions: versions.data
        .filter((v) => v.item_id === item.id)
        .map((v) => ({ id: v.id, number: v.number, label: v.label, publishedAt: v.published_at })),
      currentId: item.current_version_id,
    }];
  });
  return { ok: true, value: motions };
}

/** The agent's motions as they are saved. */
export async function loadMotions(): Promise<Outcome<SavedMotion[]>> {
  const { db, error } = await database();
  return error ?? readAll(db);
}

/** A new motion, under the id it was made with: an item for the agent, and its draft. */
export async function createMotion(raw: MotionState): Promise<Outcome<SavedMotion>> {
  const { db, error } = await database();
  if (error) return error;
  const state = checkState(raw, raw?.id, typeof raw?.name === "string" ? raw.name.trim() : "");
  if (!state || !state.name) return refused("That is not a motion this studio can keep.");
  const agent = await character(db);
  if ("error" in agent) return agent.error;
  const item = await db.from("studio_items").insert({ id: state.id, kind: "motion", name: state.name, character_id: agent.id });
  if (item.error) return item.error.code === "23505" ? refused(`A motion is already called “${state.name}”.`) : refused(item.error.message);
  const draft = await db.from("studio_drafts").insert({ item_id: state.id, data: stored(state) }).select("rev").single();
  if (draft.error) return refused(draft.error.message);
  return { ok: true, value: { state, rev: draft.data.rev, versions: [], currentId: null } };
}

/** Save a motion's draft whole on the `rev` it was loaded at, and its name on its item. */
export async function saveMotion(raw: MotionState, rev: number): Promise<Outcome<{ rev: number }>> {
  const { db, error } = await database();
  if (error) return error;
  const state = checkState(raw, raw?.id, typeof raw?.name === "string" ? raw.name.trim() : "");
  if (!state || !state.name) return refused("That is not a motion this studio can keep.");
  const named = await db.from("studio_items").update({ name: state.name }).eq("id", state.id).eq("kind", "motion").neq("name", state.name);
  if (named.error) return named.error.code === "23505" ? refused(`A motion is already called “${state.name}”.`) : refused(named.error.message);
  const saved = await db.from("studio_drafts").update({ data: stored(state) }).eq("item_id", state.id).eq("rev", rev).select("rev").maybeSingle();
  if (saved.error) return refused(saved.error.message);
  if (!saved.data) return conflict;
  return { ok: true, value: { rev: saved.data.rev } };
}

/** Delete a motion never published; a published one stays, its versions keep it. */
export async function deleteMotion(id: string): Promise<Outcome<null>> {
  const { db, error } = await database();
  if (error) return error;
  const gone = await db.from("studio_items").delete().eq("id", id).eq("kind", "motion");
  if (gone.error) {
    if (gone.error.code === "23503") return refused("A published motion stays: its versions keep it.");
    return refused(gone.error.message);
  }
  return { ok: true, value: null };
}

/**
 * Publish a motion as it was on his screen (`rev`): every motion it places pinned to that motion's current version, the
 * draft saved so, then made a version with the name he typed — the next number, and the one pages would play.
 */
export async function publishMotion(id: string, label: string, rev: number): Promise<Outcome<SavedMotion>> {
  const { db, error } = await database();
  if (error) return error;
  const draft = await db.from("studio_drafts").select("data, rev").eq("item_id", id).maybeSingle();
  if (draft.error) return refused(draft.error.message);
  if (!draft.data) return refused("There is no draft to publish.");
  if (draft.data.rev !== rev) return conflict;
  const item = await db.from("studio_items").select("name").eq("id", id).maybeSingle();
  if (item.error || !item.data) return refused(item.error?.message ?? "That motion is gone.");
  const state = checkState(draft.data.data, id, item.data.name);
  if (!state) return refused("That motion no longer reads as one.");
  // Pin what it places: each at its current version, which must exist.
  const held = [...new Set(state.rows.flatMap((r) => (r.kind === "state" ? [r.state] : [])))];
  const pins = new Map<string, string>();
  if (held.length) {
    const found = await db.from("studio_items").select("id, name, current_version_id").in("id", held);
    if (found.error) return refused(found.error.message);
    for (const h of held) {
      const it = found.data.find((f) => f.id === h);
      if (!it) return refused("A motion it places is gone. Take its row out, then publish.");
      if (!it.current_version_id) return refused(`Publish “${it.name}” first: this motion places it.`);
      pins.set(h, it.current_version_id);
    }
  }
  const pinned: MotionState = { ...state, rows: state.rows.map((r) => (r.kind === "state" ? { ...r, version: pins.get(r.state) } : r)) };
  const saved = await db.from("studio_drafts").update({ data: stored(pinned) }).eq("item_id", id).eq("rev", rev).select("rev").maybeSingle();
  if (saved.error) return refused(saved.error.message);
  if (!saved.data) return conflict;
  const published = await db.rpc("studio_publish", {
    p_item: id,
    p_label: label,
    p_ui_version: process.env.NEXT_PUBLIC_UI_VERSION ?? "unknown",
    p_rev: saved.data.rev,
  });
  if (published.error) {
    if (published.error.code === "40001") return conflict;
    if (published.error.code === "23505") return refused(`A version of this motion is already called “${label.trim()}”.`);
    if (published.error.code === "23514") return refused("A version needs a name.");
    return refused(published.error.message);
  }
  const one = await readAll(db, id);
  if (!one.ok) return one;
  return one.value[0] ? { ok: true, value: one.value[0] } : refused("That motion is gone.");
}

/** Go back to a version: the one pages would play again, and the draft its motion, to carry on from. */
export async function restoreMotion(id: string, versionId: string, rev: number): Promise<Outcome<SavedMotion>> {
  const { db, error } = await database();
  if (error) return error;
  const version = await db.from("studio_versions").select("data").eq("id", versionId).eq("item_id", id).maybeSingle();
  if (version.error) return refused(version.error.message);
  if (!version.data) return refused("That version is not this motion's.");
  const draft = await db.from("studio_drafts").update({ data: version.data.data }).eq("item_id", id).eq("rev", rev).select("rev").maybeSingle();
  if (draft.error) return refused(draft.error.message);
  if (!draft.data) return conflict;
  const current = await db.from("studio_items").update({ current_version_id: versionId }).eq("id", id);
  if (current.error) return refused(current.error.message);
  const one = await readAll(db, id);
  if (!one.ok) return one;
  return one.value[0] ? { ok: true, value: one.value[0] } : refused("That motion is gone.");
}
