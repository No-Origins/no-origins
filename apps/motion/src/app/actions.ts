"use server";

import { supabaseEnv } from "@no-origins/auth/env";
import { shown, supabaseServer } from "@no-origins/auth/server";
import { agentAction, checkActionValues } from "@no-origins/ui/lib/agent-actions";
import { checkCharacter, resolveCharacter, type CharacterLook } from "@no-origins/ui/lib/agent-body";
import { checkDrawing, isUploaded, UPLOADED, type DrawingData } from "@no-origins/ui/lib/agent-face";
import type { PropertyValues } from "@no-origins/ui/lib/properties";

/**
 * The agents' actions, in the admin's database (Motion.md M24; the tables are `supabase/migrations/…_studio_versions.sql`,
 * the kind `…_studio_actions.sql`): each action an item of kind `action`, named as it is in code, with one draft — its
 * id in code and every control's value, whole — and its published versions, `major`.`minor` (Orbit.md C19). **An action
 * is every agent's** (M23), so it names no character. The agents are read too, as Orbit has them, to preview an action
 * on (`loadAgents`). Server functions, as Orbit's are: the signed-in person's session, and RLS deciding what they may
 * do — his only. Each checks someone is signed in, since a server function can be reached by a POST from anywhere.
 *
 * - **A draft** is the action's values as they stand, saved whole on the `rev` it was loaded at: another device's save
 *   first is refused, not merged.
 * - **Publishing** makes the draft a version: the latest's next minor, or the next major at .0 when he says so. A
 *   version never changes afterwards; any change after it is the next publish.
 * - **Going back** to a version makes it the one pages would play, and the draft its values, to carry on from.
 *
 * The motions that were here (M19, M20) went with M24: their rows, their tabs and their saving.
 *
 * With no Supabase keys every call says `offline`, and the studio keeps an action's values in the browser.
 *
 * **An account that may open the studio but not save** (`motion.open` alone — Member, Access.md A4) tries every control
 * and saves nothing, as Orbit's visitors do (Orbit.md C24): it cannot read drafts, so it is shown each action as it is
 * published, and each agent as Orbit publishes it; `may` says so, read from the token (Access.md A6), and the
 * database's rules refuse a write whatever a page does.
 */

export type ActionVersion = { id: string; major: number; minor: number; publishedAt: string };

export type SavedAction = {
  /** Its item's id. */
  id: string;
  /** The action's id in code. */
  action: string;
  /** Every control's value, whole, keyed by setting id. */
  values: PropertyValues;
  /** The draft's `rev` as loaded: the next save names it. */
  rev: number;
  /** Newest first. */
  versions: ActionVersion[];
  /** The version pages would play, and its values. */
  currentId: string | null;
  current: PropertyValues | null;
};

/** What this session may do with an action (Access.md A3): save its draft, and publish it. */
export type ActionsMay = { save: boolean; publish: boolean };

/** What a publish adds to the latest version (C19): one to its minor, or one to its major, at .0. */
export type PublishStep = "minor" | "major";

export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "offline" | "signed-out" | "conflict" | "refused"; message: string };

const offline = { ok: false, reason: "offline", message: "Saved in this browser only: this server has no database keys." } as const;
const signedOut = { ok: false, reason: "signed-out", message: "Sign in to save." } as const;
const refused = (message: string) => ({ ok: false, reason: "refused", message }) as const;
const conflict = {
  ok: false,
  reason: "conflict",
  message: "This action was changed somewhere else since it was loaded. Load it to carry on from there.",
} as const;

async function database() {
  if (!supabaseEnv()) return { error: offline } as const;
  const db = await supabaseServer();
  const { data } = await db.auth.getUser();
  if (!data.user) return { error: signedOut } as const;
  return { db } as const;
}

type Db = Awaited<ReturnType<typeof supabaseServer>>;

/** A draft's data, read back as an action's: its id in code, and its values checked against what it offers now. */
function readDraft(data: unknown): { action: string; values: PropertyValues } | null {
  const d = data && typeof data === "object" ? (data as { action?: unknown; values?: unknown }) : {};
  const action = typeof d.action === "string" ? agentAction(d.action) : undefined;
  return action ? { action: action.id, values: checkActionValues(action, d.values) } : null;
}

/** Every action, each with its draft and versions; or the one item `only`. */
async function readAll(db: Db, only?: string): Promise<Outcome<SavedAction[]>> {
  let query = db.from("studio_items").select("id, current_version_id").eq("kind", "action");
  if (only) query = query.eq("id", only);
  const items = await query.order("created_at", { ascending: true });
  if (items.error) return refused(items.error.message);
  const ids = items.data.map((i) => i.id);
  if (!ids.length) return { ok: true, value: [] };
  const [drafts, versions] = await Promise.all([
    db.from("studio_drafts").select("item_id, data, rev").in("item_id", ids),
    db.from("studio_versions").select("id, item_id, number, minor, data, published_at").in("item_id", ids)
      .order("number", { ascending: false }).order("minor", { ascending: false }),
  ]);
  if (drafts.error) return refused(drafts.error.message);
  if (versions.error) return refused(versions.error.message);
  const actions = items.data.flatMap((item): SavedAction[] => {
    const own = versions.data.filter((v) => v.item_id === item.id);
    const current = own.find((v) => v.id === item.current_version_id);
    // No draft to read — an account that may not save, by RLS — is the version pages play, or else the newest.
    const draft = drafts.data.find((d) => d.item_id === item.id);
    const shownVersion = current ?? own[0];
    const read = draft ? readDraft(draft.data) : shownVersion ? readDraft(shownVersion.data) : null;
    if (!read) return [];
    return [{
      id: item.id,
      action: read.action,
      values: read.values,
      rev: draft ? draft.rev : -1,
      versions: own.map((v) => ({ id: v.id, major: v.number, minor: v.minor, publishedAt: v.published_at })),
      currentId: item.current_version_id,
      current: current ? readDraft(current.data)?.values ?? null : null,
    }];
  });
  return { ok: true, value: actions };
}

/** The actions as they are saved — or, for an account that may not save, as they are published — and what it may do. */
export async function loadActions(): Promise<Outcome<{ actions: SavedAction[]; may: ActionsMay }>> {
  const { db, error } = await database();
  if (error) return error;
  const [all, { may }] = await Promise.all([readAll(db), shown(["motion.draft.save", "motion.version.publish"] as const)]);
  if (!all.ok) return all;
  return { ok: true, value: { actions: all.value, may: { save: may["motion.draft.save"], publish: may["motion.version.publish"] } } };
}

/**
 * An agent to preview an action on (M23): its name, its look as Orbit has it now — its draft, groups 1 and 2, never how
 * it moves — and the uploaded drawings that look wears, by version id.
 */
export type PreviewAgent = { id: string; name: string; look: CharacterLook; drawings: Record<string, DrawingData> };

/** Every agent there is, by name, each as Orbit has it. Reading only: the motion studio never writes a character. */
export async function loadAgents(): Promise<Outcome<PreviewAgent[]>> {
  const { db, error } = await database();
  if (error) return error;
  const items = await db.from("studio_items").select("id, name, current_version_id").eq("kind", "character").order("name");
  if (items.error) return refused(items.error.message);
  if (!items.data.length) return { ok: true, value: [] };
  const drafts = await db.from("studio_drafts").select("item_id, data").in("item_id", items.data.map((i) => i.id));
  if (drafts.error) return refused(drafts.error.message);
  // Anyone without Orbit's drafts — an account that may only open this studio — sees each agent as Orbit publishes it (C24).
  const unread = items.data.filter((i) => i.current_version_id && !drafts.data.some((d) => d.item_id === i.id));
  const published = unread.length
    ? await db.from("studio_versions").select("id, data").in("id", unread.map((i) => i.current_version_id!))
    : { data: [] as { id: string; data: unknown }[], error: null };
  if (published.error) return refused(published.error.message);
  const looks = new Map([
    ...drafts.data.map((d) => [d.item_id, resolveCharacter(checkCharacter(d.data))] as const),
    ...unread.flatMap((i) => {
      const version = published.data.find((v) => v.id === i.current_version_id);
      return version ? [[i.id, resolveCharacter(checkCharacter(version.data))] as const] : [];
    }),
  ]);
  const wornBy = (look: CharacterLook) =>
    Object.values(look.face).flatMap((wear) => (isUploaded(wear?.style) ? [wear.style.slice(UPLOADED.length)] : []));
  const worn = [...new Set([...looks.values()].flatMap(wornBy))];
  const drawn = worn.length ? await db.from("studio_versions").select("id, data").in("id", worn) : { data: [] as { id: string; data: unknown }[], error: null };
  if (drawn.error) return refused(drawn.error.message);
  const shapes = new Map(drawn.data.flatMap((v) => {
    const data = checkDrawing(v.data);
    return data ? [[v.id, data] as const] : [];
  }));
  return {
    ok: true,
    value: items.data.map((item) => {
      const look = looks.get(item.id) ?? resolveCharacter({ body: {}, face: {} });
      const drawings = Object.fromEntries(wornBy(look).flatMap((id) => (shapes.has(id) ? [[id, shapes.get(id)!]] : [])));
      return { id: item.id, name: item.name, look, drawings };
    }),
  };
}

/**
 * An action's item and draft, the first time it is saved: named as it is in code, its values as he has them. Made by
 * another device first, it is that one that comes back.
 */
export async function createAction(actionId: string, values: unknown): Promise<Outcome<SavedAction>> {
  const { db, error } = await database();
  if (error) return error;
  const action = agentAction(actionId);
  if (!action) return refused("That is not an action this studio has.");
  const item = await db.from("studio_items").insert({ kind: "action", name: action.label }).select("id").single();
  if (item.error) {
    if (item.error.code !== "23505") return refused(item.error.message);
    const all = await readAll(db);
    if (!all.ok) return all;
    const made = all.value.find((a) => a.action === action.id);
    return made ? { ok: true, value: made } : refused(`An action is already called “${action.label}”.`);
  }
  const data = { action: action.id, values: checkActionValues(action, values) };
  const draft = await db.from("studio_drafts").insert({ item_id: item.data.id, data }).select("rev").single();
  if (draft.error) return refused(draft.error.message);
  return { ok: true, value: { id: item.data.id, action: action.id, values: data.values, rev: draft.data.rev, versions: [], currentId: null, current: null } };
}

/** Save an action's draft whole on the `rev` it was loaded at. */
export async function saveAction(id: string, actionId: string, values: unknown, rev: number): Promise<Outcome<{ rev: number }>> {
  const { db, error } = await database();
  if (error) return error;
  const action = agentAction(actionId);
  if (!action) return refused("That is not an action this studio has.");
  const data = { action: action.id, values: checkActionValues(action, values) };
  const saved = await db.from("studio_drafts").update({ data }).eq("item_id", id).eq("rev", rev).select("rev").maybeSingle();
  if (saved.error) return refused(saved.error.message);
  if (!saved.data) return conflict;
  return { ok: true, value: { rev: saved.data.rev } };
}

/**
 * Publish an action as it was on his screen (`rev`): the latest version's next minor, or the next major at .0 (C19). It
 * becomes the one pages would play.
 */
export async function publishAction(id: string, step: PublishStep, rev: number): Promise<Outcome<SavedAction>> {
  const { db, error } = await database();
  if (error) return error;
  if (step !== "minor" && step !== "major") return refused("A publish is a minor version or a major one.");
  const published = await db.rpc("studio_publish", {
    p_item: id,
    p_ui_version: process.env.NEXT_PUBLIC_UI_VERSION ?? "unknown",
    p_rev: rev,
    p_step: step,
  });
  if (published.error) {
    if (published.error.code === "40001") return conflict;
    return refused(published.error.message);
  }
  const one = await readAll(db, id);
  if (!one.ok) return one;
  return one.value[0] ? { ok: true, value: one.value[0] } : refused("That action is gone.");
}

/** Go back to a version: the one pages would play again, and the draft its values, to carry on from. */
export async function restoreAction(id: string, versionId: string, rev: number): Promise<Outcome<SavedAction>> {
  const { db, error } = await database();
  if (error) return error;
  const version = await db.from("studio_versions").select("data").eq("id", versionId).eq("item_id", id).maybeSingle();
  if (version.error) return refused(version.error.message);
  if (!version.data) return refused("That version is not this action's.");
  const draft = await db.from("studio_drafts").update({ data: version.data.data }).eq("item_id", id).eq("rev", rev).select("rev").maybeSingle();
  if (draft.error) return refused(draft.error.message);
  if (!draft.data) return conflict;
  const current = await db.from("studio_items").update({ current_version_id: versionId }).eq("id", id);
  if (current.error) return refused(current.error.message);
  const one = await readAll(db, id);
  if (!one.ok) return one;
  return one.value[0] ? { ok: true, value: one.value[0] } : refused("That action is gone.");
}
