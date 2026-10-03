"use server";

import { supabaseEnv } from "@no-origins/auth/env";
import { supabaseServer } from "@no-origins/auth/server";
import { checkCharacter, resolveCharacter, type CharacterLook } from "@no-origins/ui/lib/agent-body";
import { checkDrawing, type DrawingData } from "@no-origins/ui/lib/agent-face";

import { isUploadSlot, MAX_FILE, strictDrawing, type UploadSlot } from "@/lib/drawing";

/**
 * The character's draft and versions, in the admin's database (Orbit.md C6, Motion.md M20; the tables are
 * `supabase/migrations/…_studio_versions.sql`). Server functions, as every read and write in the apps goes through the
 * server (`@no-origins/auth/server`): the session, if there is one, and RLS deciding what it may do.
 *
 * **Reading is everyone's; writing is the owner's** (C24, his, 2026-10-03: "only when I log in as an admin should I be
 * able to publish, so that users can experiment and play around"). A visitor — nobody signed in, or someone signed in
 * who is not the owner — loads each agent as its current published version (`…_studio_public_read.sql`), never the
 * draft, and `editable` is false: the page is theirs to play with and nothing is saved. The owner loads the draft and
 * saves, publishes, goes back, makes agents and uploads as before. Every write checks that the owner is the one
 * asking, since a server function can be reached by a POST from anywhere; RLS would refuse anyway.
 *
 * A look is **held whole** (`resolveCharacter`): every value of its look (never how it moves, Motion.md M23), so a published version never follows a default that
 * changes in code later. A value missing from one read back is a setting declared since, and takes its default then.
 *
 * With no Supabase keys — a development server, CI's sweep — there is nowhere to save: every call says `offline`, and
 * the studio works on the page alone.
 */

/** The character the studio opens on: Bali, the Guide of the six (Agents.md; his name, 2026-09-30), the Agent until then, stored with version 12 as its first. */
const CHARACTER = "Bali";

/** A character there is: what the studio's chooser lists (Orbit.md C13). */
export type CharacterEntry = { id: string; name: string };

/**
 * A published version: `major`.`minor` (C19). A publish is the latest's next minor, or the next major at .0 when he
 * says so. The name is the motion studio's habit and the agent's first versions'; one published here has none.
 */
export type CharacterVersion = { id: string; major: number; minor: number; label: string | null; publishedAt: string };

/** What a publish adds to the latest version (C19): one to its minor, or one to its major, at .0. */
export type PublishStep = "minor" | "major";

/** An uploaded style (C8): a drawing, its slot, and the version it stands at in the library. */
export type UploadedDrawing = { itemId: string; name: string; slot: UploadSlot; versionId: string; number: number };

export type CharacterState = {
  itemId: string;
  /** Whether the draft is the signed-in person's to save and publish: the owner's (C24). A visitor plays, and nothing is saved. */
  editable: boolean;
  /** Every character this account may see, by name: the six (Agents.md A2), and any made since. */
  characters: CharacterEntry[];
  look: CharacterLook;
  /** The draft's `rev` as loaded: the next save names it, and one from another device first is refused. */
  rev: number;
  /** Newest first. */
  versions: CharacterVersion[];
  /** The version pages show. */
  currentId: string | null;
  /** The drawings uploaded for this character, each at its current version: the library's uploaded styles. */
  drawings: UploadedDrawing[];
  /** Every drawing version's shapes, by version id: what the agent draws for an `upload:<id>` a look wears. */
  drawingData: Record<string, DrawingData>;
};

export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "offline" | "signed-out" | "conflict" | "refused"; message: string };

const offline = { ok: false, reason: "offline", message: "Nothing is saved here: this server has no database keys." } as const;
const signedOut = { ok: false, reason: "signed-out", message: "Sign in as the owner to save and publish." } as const;
const refused = (message: string) => ({ ok: false, reason: "refused", message }) as const;
const conflict = {
  ok: false,
  reason: "conflict",
  message: "The draft was changed somewhere else since it was loaded. Load it to carry on from there.",
} as const;

/**
 * The database as whoever is asking — a visitor on the anon key's own policies, or the signed-in person on theirs —
 * and whether that is the owner, whose the draft is (C24). Or why there is no database.
 */
async function database() {
  if (!supabaseEnv()) return { error: offline } as const;
  const db = await supabaseServer();
  const { data } = await db.auth.getUser();
  let editable = false;
  if (data.user) {
    // The role is read, never trusted from the token (`currentProfile`'s reasoning): `profiles` is what RLS reads.
    const profile = await db.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    editable = profile.data?.role === "owner";
  }
  return { db, editable } as const;
}

/** The database for a write: the owner's, or why not. */
async function writer() {
  const { db, editable, error } = await database();
  if (error) return { error } as const;
  if (!editable) return { error: signedOut } as const;
  return { db } as const;
}

type Db = Awaited<ReturnType<typeof supabaseServer>>;

/**
 * What a look is read from: the owner's draft, and the `rev` the next save names; for anyone else the version pages
 * show (C24) — the draft is his alone, by RLS, and not asked for — or, before a first publish, nothing, which resolves
 * to the look the package declares.
 */
async function source(
  db: Db,
  item: { id: string; current_version_id: string | null },
  editable: boolean,
): Promise<{ look: unknown; rev: number } | { error: string }> {
  if (editable) {
    const draft = await db.from("studio_drafts").select("data, rev").eq("item_id", item.id).maybeSingle();
    if (draft.error) return { error: draft.error.message };
    if (draft.data) return { look: draft.data.data, rev: draft.data.rev };
  }
  if (!item.current_version_id) return { look: {}, rev: 0 };
  const version = await db.from("studio_versions").select("data").eq("id", item.current_version_id).maybeSingle();
  if (version.error) return { error: version.error.message };
  return { look: version.data?.data ?? {}, rev: 0 };
}

/**
 * `itemId`'s character, or the one the studio opens on; and every character there is, for the chooser. The owner
 * (`editable`) reads its draft; anyone else reads the version pages show (C24).
 */
async function read(db: Db, itemId: string | undefined, editable: boolean): Promise<Outcome<CharacterState>> {
  const all = await db.from("studio_items").select("id, name, current_version_id").eq("kind", "character").order("name");
  if (all.error) return refused(all.error.message);
  const characters = all.data.map((c) => ({ id: c.id, name: c.name }));
  const item = { data: all.data.find((c) => (itemId ? c.id === itemId : c.name === CHARACTER)) ?? all.data[0] };
  if (!item.data) return refused(`There is no agent to show.`);
  const [from, versions] = await Promise.all([
    source(db, item.data, editable),
    db
      .from("studio_versions")
      .select("id, number, minor, label, published_at")
      .eq("item_id", item.data.id)
      .order("number", { ascending: false })
      .order("minor", { ascending: false }),
  ]);
  if ("error" in from) return refused(from.error);
  if (versions.error) return refused(versions.error.message);
  // The uploaded styles made for it, and every version of each: a look may still wear an older one.
  const items = await db.from("studio_items").select("id, name, slot, current_version_id").eq("kind", "drawing").eq("character_id", item.data.id);
  if (items.error) return refused(items.error.message);
  const ids = items.data.map((d) => d.id);
  const drawn = ids.length
    ? await db.from("studio_versions").select("id, item_id, number, data").in("item_id", ids)
    : { data: [] as { id: string; item_id: string; number: number; data: unknown }[], error: null };
  if (drawn.error) return refused(drawn.error.message);
  const drawingData: Record<string, DrawingData> = {};
  for (const v of drawn.data) {
    const data = checkDrawing(v.data);
    if (data) drawingData[v.id] = data;
  }
  const drawings = items.data.flatMap((d): UploadedDrawing[] => {
    const current = drawn.data.find((v) => v.id === d.current_version_id);
    return current && isUploadSlot(d.slot) && drawingData[current.id]
      ? [{ itemId: d.id, name: d.name, slot: d.slot, versionId: current.id, number: current.number }]
      : [];
  });
  return {
    ok: true,
    value: {
      itemId: item.data.id,
      editable,
      characters,
      look: resolveCharacter(checkCharacter(from.look ?? {})),
      rev: from.rev,
      versions: versions.data.map((v) => ({ id: v.id, major: v.number, minor: v.minor, label: v.label, publishedAt: v.published_at })),
      currentId: item.data.current_version_id,
      drawings,
      drawingData,
    },
  };
}

/**
 * A character as it is kept — `itemId`'s, or the one the studio opens on: its versions, the one pages show, and its
 * draft for the owner or that version's look for anyone else (C24).
 */
export async function loadCharacter(itemId?: string): Promise<Outcome<CharacterState>> {
  const { db, editable, error } = await database();
  return error ?? read(db, itemId, editable);
}

/** Save the draft whole, on the `rev` it was loaded at. Refused, not merged, when another device saved first. */
export async function saveDraft(itemId: string, look: CharacterLook, rev: number): Promise<Outcome<{ rev: number }>> {
  const { db, error } = await writer();
  if (error) return error;
  const saved = await db
    .from("studio_drafts")
    .update({ data: resolveCharacter(checkCharacter(look)) })
    .eq("item_id", itemId)
    .eq("rev", rev)
    .select("rev")
    .maybeSingle();
  if (saved.error) return refused(saved.error.message);
  if (!saved.data) return conflict;
  return { ok: true, value: { rev: saved.data.rev } };
}

/**
 * Publish the draft as it was on his screen (`rev`): a new version, and the one pages show. `step` is what it adds to
 * the latest version (C19): `minor`, what the bar's Publish does, or `major`, the next one at .0. No name: he gives the
 * character one, not each version. A version never changes afterwards; any change after it is the next publish.
 */
export async function publishCharacter(itemId: string, step: PublishStep, rev: number): Promise<Outcome<CharacterState>> {
  const { db, error } = await writer();
  if (error) return error;
  if (step !== "minor" && step !== "major") return refused("A publish is a minor version or a major one.");
  const published = await db.rpc("studio_publish", {
    p_item: itemId,
    p_ui_version: process.env.NEXT_PUBLIC_UI_VERSION ?? "unknown",
    p_rev: rev,
    p_step: step,
  });
  if (published.error) {
    if (published.error.code === "40001") return conflict;
    return refused(published.error.message);
  }
  return read(db, itemId, true);
}

/**
 * A new character, by the name he gives it (C19): its draft starts from the look the code declares, the package's
 * defaults, whole (`resolveCharacter`), and it has no version until its first publish, which is 1.0. Returns it opened.
 */
export async function createCharacter(name: string): Promise<Outcome<CharacterState>> {
  const { db, error } = await writer();
  if (error) return error;
  const title = name.trim();
  if (!title) return refused("A new agent needs a name.");
  const made = await db.rpc("studio_new_character", {
    p_name: title,
    p_data: resolveCharacter({ body: {}, face: {} }),
  });
  if (made.error) {
    if (made.error.code === "23505") return refused(`An agent is already called “${title}”.`);
    return refused(made.error.message);
  }
  return read(db, made.data as string, true);
}

/**
 * Go back to a version: pages show it again, and the draft becomes its look, to carry on from. Nothing is renumbered,
 * and the next publish still counts from the latest version, not this one.
 */
export async function restoreCharacter(itemId: string, versionId: string, rev: number): Promise<Outcome<CharacterState>> {
  const { db, error } = await writer();
  if (error) return error;
  const version = await db.from("studio_versions").select("data").eq("id", versionId).eq("item_id", itemId).maybeSingle();
  if (version.error) return refused(version.error.message);
  if (!version.data) return refused("That version is not this character's.");
  const draft = await db
    .from("studio_drafts")
    .update({ data: version.data.data })
    .eq("item_id", itemId)
    .eq("rev", rev)
    .select("rev")
    .maybeSingle();
  if (draft.error) return refused(draft.error.message);
  if (!draft.data) return conflict;
  const current = await db.from("studio_items").update({ current_version_id: versionId }).eq("id", itemId);
  if (current.error) return refused(current.error.message);
  return read(db, itemId, true);
}

/**
 * Upload a style for `slot` (C8): the shapes the page cleaned, checked again here — strictly, since a server function
 * can be sent anything — and the file as he gave it, kept beside them in the private `assets` bucket. A drawing of the
 * same name in the same slot takes it as its next version; a new name is a new drawing. Returns the version, which a
 * look wears as `upload:<id>`.
 */
export async function uploadDrawing(
  itemId: string,
  slot: string,
  name: string,
  file: string,
  data: unknown,
): Promise<Outcome<{ versionId: string; state: CharacterState }>> {
  const { db, error } = await writer();
  if (error) return error;
  const title = name.trim();
  if (!isUploadSlot(slot)) return refused("That slot does not take an uploaded style.");
  if (!title) return refused("An uploaded style needs a name.");
  if (file.length > MAX_FILE || !/<svg[\s>]/i.test(file)) return refused("The file is not an SVG this studio takes.");
  const checked = strictDrawing(data);
  if (!checked.ok) return refused(checked.reason);

  // Uploads are a character's own (`character_id`): each of the six has a library of its own.
  const character = await db.from("studio_items").select("id").eq("kind", "character").eq("id", itemId).maybeSingle();
  if (character.error) return refused(character.error.message);
  if (!character.data) return refused("That character is not one this account may see.");
  // The drawing: this name in this slot, whatever its case, or a new one.
  const same = await db
    .from("studio_items")
    .select("id, name")
    .eq("kind", "drawing")
    .eq("slot", slot)
    .eq("character_id", character.data.id)
    .ilike("name", title.replace(/[%_\\]/g, (c) => `\\${c}`));
  if (same.error) return refused(same.error.message);
  let drawing = same.data[0]?.id;
  if (!drawing) {
    const made = await db
      .from("studio_items")
      .insert({ kind: "drawing", name: title, slot, character_id: character.data.id })
      .select("id")
      .single();
    if (made.error) return refused(made.error.message);
    drawing = made.data.id;
  }

  // The file first, then the version that names it: a version is frozen, so it never names a file that is not there.
  const versionId = crypto.randomUUID();
  const source = `drawings/${drawing}/${versionId}.svg`;
  const stored = await db.storage.from("assets").upload(source, new Blob([file], { type: "image/svg+xml" }), { contentType: "image/svg+xml" });
  if (stored.error) return refused(`The file could not be kept: ${stored.error.message}`);
  const version = await db.from("studio_versions").insert({
    id: versionId,
    item_id: drawing,
    label: `Uploaded ${new Date().toISOString().replace("T", " ").slice(0, 19)}`,
    data: checked.data,
    ui_version: process.env.NEXT_PUBLIC_UI_VERSION ?? "unknown",
    source,
  });
  if (version.error) return refused(version.error.message);
  const state = await read(db, itemId, true);
  return state.ok ? { ok: true, value: { versionId, state: state.value } } : state;
}
