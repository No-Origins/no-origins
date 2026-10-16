"use client";

import { tokenClaims } from "@no-origins/auth/claims";
import { supabaseBrowser } from "@no-origins/auth/client";
import { supabaseEnv } from "@no-origins/auth/env";

import { newVariantId, type Variant } from "./variants";

/**
 * An element's library, from the database (World.md W73; his: "I think we should start using database"; Admin.md
 * §0.6: the page is static, a component may be live). The studios' tables hold it: an item of the element's kind
 * (`mountain`, `tree`, `portal`, `pipe`, `road`, `human`; `world` the world; `environment` the environment, W75), its draft, his work
 * in progress, and its published versions, the current one what every page shows (Orbit.md C24). Everyone reads what
 * is published, with the anon key
 * through the public-read policies; nobody reads a draft but an account that may save (`orbit.draft.save`), which
 * reads its own drafts too, so the card shows him what he last saved. The fallback is his published copy in code
 * (`his`, `published.ts`): what is drawn with no keys, before the read, or when it fails. A variant in code and its
 * item in the database share an id, so a code variant not yet in the database is published from its card, and the
 * database's rows stand in for the code's as they come.
 *
 * Saving: Save keeps the picked variant's draft on the `rev` it was loaded at (another device's save first is refused,
 * not merged; Admin.md §6.4); Publish saves, then makes the draft a version, the next minor; New variant makes an item
 * with a uuid of its own and its first draft; the Name renames the item; Delete takes an item never published away
 * (a version keeps its item). Who may do what is the token's (`orbit.draft.save`, `orbit.version.publish`), and the
 * database's rules refuse the rest whatever a page does. Nothing here is three.js.
 */
export type StudioKind = "mountain" | "tree" | "portal" | "pipe" | "road" | "human" | "world" | "environment";

export type LibraryVariant<C> = Variant<C> & {
  /** The draft's `rev` as loaded, or null for a variant the database has not got: the code's. */
  rev: number | null;
  /** The version pages show, `major.minor`, or null for one never published. */
  version: string | null;
  /** Whether the draft has moved on from the version pages show. */
  ahead: boolean;
};

/** Who is reading: still loading; a server with no keys; a visitor, who plays and saves nothing; an account that saves. */
export type Who = "loading" | "offline" | "visitor" | "editor";

export type Library<C> = {
  variants: LibraryVariant<C>[];
  picked: string;
  who: Who;
  may: { save: boolean; publish: boolean };
  /** What the card says of the last save or publish, or why it cannot. */
  note: string | null;
};

export type Outcome = { ok: true } | { ok: false; message: string };

export type LibraryStore<C> = {
  get(): Library<C>;
  start(): Library<C>;
  subscribe(listener: () => void): () => void;
  /** Picks a variant; the card then loads its settings into the element's store. */
  pick(id: string): void;
  /** The variant picked, or the first. */
  picked(): LibraryVariant<C> | undefined;
  /** Save the picked variant's draft as these settings. */
  save(settings: C): Promise<Outcome>;
  /** Save, then publish the draft as the next version. */
  publish(settings: C): Promise<Outcome>;
  /** A new variant of these settings, named, picked. */
  create(name: string, settings: C): Promise<Outcome>;
  rename(name: string): Promise<Outcome>;
  /** Takes the picked variant away, where it was never published. */
  remove(): Promise<Outcome>;
  /** Reads the database again. */
  reload(): Promise<void>;
};

let client: ReturnType<typeof supabaseBrowser> | null = null;
/** One browser client for every library: the session the apps share (Admin.md §8.4), and the anon key's reads. */
function database() {
  if (!supabaseEnv()) return null;
  client ??= supabaseBrowser();
  return client;
}

const SAVE = "orbit.draft.save";
const PUBLISH = "orbit.version.publish";
const uiVersion = () => process.env.NEXT_PUBLIC_UI_VERSION ?? "unknown";

/** What the card says for a visitor, and for a server with no keys. */
export const VISITOR_NOTE = "Yours to play with: sign in to save.";
export const OFFLINE_NOTE = "This server has no database keys: the world is its published copy, and nothing saves.";

export function libraryStore<C extends object>(kind: StudioKind, his: readonly Variant<C>[], settingsOf: (saved: unknown) => C | null): LibraryStore<C> {
  const code = (variant: Variant<C>): LibraryVariant<C> => ({ ...variant, rev: null, version: null, ahead: false });
  const start: Library<C> = { variants: his.map(code), picked: his[0]?.id ?? "", who: "loading", may: { save: false, publish: false }, note: null };
  let library = start;
  const listeners = new Set<() => void>();
  const publish = (next: Library<C>) => {
    library = next;
    listeners.forEach((listener) => listener());
  };
  const pickedOf = (lib: Library<C>) => lib.variants.find((variant) => variant.id === lib.picked) ?? lib.variants[0];
  let loading: Promise<void> | null = null;
  let watched = false;

  const read = async () => {
    const db = database();
    if (!db) {
      publish({ ...library, who: "offline", note: OFFLINE_NOTE });
      return;
    }
    const { data: session } = await db.auth.getSession();
    const perms = session.session ? tokenClaims(session.session.access_token)?.perms ?? [] : [];
    const may = { save: perms.includes(SAVE), publish: perms.includes(PUBLISH) };
    const who: Who = session.session && may.save ? "editor" : "visitor";
    const items = await db.from("studio_items").select("id, name, current_version_id").eq("kind", kind).order("created_at");
    if (items.error) {
      publish({ ...library, who, may, note: `The database could not be read: ${items.error.message}` });
      return;
    }
    const currentIds = items.data.flatMap((item) => (item.current_version_id ? [item.current_version_id] : []));
    const versions = currentIds.length ? await db.from("studio_versions").select("id, item_id, number, minor, data").in("id", currentIds) : { data: [], error: null };
    const drafts = who === "editor" && items.data.length ? await db.from("studio_drafts").select("item_id, data, rev").in("item_id", items.data.map((item) => item.id)) : { data: [], error: null };
    const byItem = new Map(versions.data?.map((version) => [version.item_id, version]) ?? []);
    const draftOf = new Map(drafts.data?.map((draft) => [draft.item_id, draft]) ?? []);
    const variants = his.map(code);
    for (const item of items.data) {
      const version = byItem.get(item.id);
      const draft = draftOf.get(item.id);
      // A visitor sees what is published; an editor what he last saved, and whether it has moved on.
      const source = who === "editor" && draft ? draft.data : version?.data;
      if (source === undefined) continue;
      const settings = settingsOf(source);
      if (!settings) continue;
      const row: LibraryVariant<C> = {
        id: item.id,
        name: item.name,
        settings,
        rev: draft?.rev ?? null,
        version: version ? `${version.number}.${version.minor}` : null,
        ahead: !!draft && !!version && JSON.stringify(draft.data) !== JSON.stringify(version.data),
      };
      const at = variants.findIndex((variant) => variant.id === item.id);
      if (at >= 0) variants[at] = row;
      else variants.push(row);
    }
    const picked = variants.some((variant) => variant.id === library.picked) ? library.picked : variants[0]?.id ?? "";
    publish({ variants, picked, who, may, note: who === "visitor" ? VISITOR_NOTE : null });
  };
  const load = () => (loading ??= read().catch((error: unknown) => {
    publish({ ...library, who: library.who === "loading" ? "visitor" : library.who, note: `The database could not be read: ${error instanceof Error ? error.message : String(error)}` });
  }).finally(() => { loading = null; }));
  const watch = () => {
    if (watched) return;
    watched = true;
    void load();
    database()?.auth.onAuthStateChange(() => void load());
  };

  const refused = (message: string): Outcome => {
    publish({ ...library, note: message });
    return { ok: false, message };
  };
  const editor = () => {
    const db = database();
    if (!db) return { error: refused(OFFLINE_NOTE) } as const;
    if (library.who !== "editor" || !library.may.save) return { error: refused("Sign in with an account that may save and publish here.") } as const;
    return { db } as const;
  };
  /** The variant's item and draft in the database, made if the database has not got them (a variant from code). */
  const ensure = async (db: NonNullable<ReturnType<typeof database>>, variant: LibraryVariant<C>, settings: C): Promise<Outcome & { rev?: number }> => {
    if (variant.rev !== null) return { ok: true, rev: variant.rev };
    const item = await db.from("studio_items").insert({ id: variant.id, kind, name: variant.name }).select("id").single();
    if (item.error && item.error.code !== "23505") return { ok: false, message: item.error.message };
    const draft = await db.from("studio_drafts").upsert({ item_id: variant.id, data: settings }, { onConflict: "item_id" }).select("rev").single();
    if (draft.error) return { ok: false, message: draft.error.message };
    return { ok: true, rev: draft.data.rev };
  };
  const saved = (id: string, settings: C, rev: number, more: Partial<LibraryVariant<C>> = {}) =>
    publish({ ...library, variants: library.variants.map((variant) => (variant.id === id ? { ...variant, settings, rev, ahead: variant.version !== null, ...more } : variant)) });

  const save = async (settings: C): Promise<Outcome> => {
    const { db, error } = editor();
    if (error) return error;
    const variant = pickedOf(library);
    if (!variant) return refused("There is no variant to save.");
    if (variant.rev === null) {
      const made = await ensure(db, variant, settings);
      if (!made.ok) return refused(made.message);
      saved(variant.id, settings, made.rev!);
      publish({ ...library, note: "Saved." });
      return { ok: true };
    }
    const draft = await db.from("studio_drafts").update({ data: settings }).eq("item_id", variant.id).eq("rev", variant.rev).select("rev").maybeSingle();
    if (draft.error) return refused(draft.error.message);
    if (!draft.data) {
      void load();
      return refused("This variant was saved somewhere else since it was loaded: it is loaded again.");
    }
    saved(variant.id, settings, draft.data.rev);
    publish({ ...library, note: "Saved." });
    return { ok: true };
  };

  return {
    get: () => library,
    start: () => start,
    subscribe(listener) {
      listeners.add(listener);
      watch();
      return () => {
        listeners.delete(listener);
      };
    },
    pick: (id) => publish({ ...library, picked: id, note: library.who === "visitor" ? VISITOR_NOTE : null }),
    picked: () => pickedOf(library),
    save,
    async publish(settings) {
      const { db, error } = editor();
      if (error) return error;
      if (!library.may.publish) return refused("Sign in with an account that may publish here.");
      const variant = pickedOf(library);
      if (!variant) return refused("There is no variant to publish.");
      if (variant.rev === null || JSON.stringify(variant.settings) !== JSON.stringify(settings)) {
        const kept = await save(settings);
        if (!kept.ok) return kept;
      }
      const now = pickedOf(library);
      if (!now || now.rev === null) return refused("The draft could not be saved first.");
      const version = await db.rpc("studio_publish", { p_item: now.id, p_ui_version: uiVersion(), p_rev: now.rev, p_label: null, p_step: "minor" });
      if (version.error) {
        if (version.error.code === "40001") {
          void load();
          return refused("This variant was saved somewhere else since it was loaded: it is loaded again.");
        }
        return refused(version.error.message);
      }
      const made = version.data as { id: string; number: number; minor: number };
      saved(now.id, settings, now.rev, { version: `${made.number}.${made.minor}`, ahead: false });
      publish({ ...library, note: `Published ${made.number}.${made.minor}.` });
      return { ok: true };
    },
    async create(name, settings) {
      const { db, error } = editor();
      if (error) return error;
      const id = newVariantId();
      const item = await db.from("studio_items").insert({ id, kind, name: name.trim() }).select("id").single();
      if (item.error) return refused(item.error.code === "23505" ? `A ${kind} is already called “${name.trim()}”.` : item.error.message);
      const draft = await db.from("studio_drafts").insert({ item_id: id, data: settings }).select("rev").single();
      if (draft.error) return refused(draft.error.message);
      publish({ ...library, variants: [...library.variants, { id, name: name.trim(), settings, rev: draft.data.rev, version: null, ahead: false }], picked: id, note: "Saved as a new variant." });
      return { ok: true };
    },
    async rename(name) {
      const { db, error } = editor();
      if (error) return error;
      const variant = pickedOf(library);
      if (!variant || !name.trim()) return refused("There is no variant to rename.");
      if (variant.rev === null) {
        const made = await ensure(db, variant, variant.settings);
        if (!made.ok) return refused(made.message);
        saved(variant.id, variant.settings, made.rev!);
      }
      const item = await db.from("studio_items").update({ name: name.trim() }).eq("id", variant.id).select("id").maybeSingle();
      if (item.error) return refused(item.error.code === "23505" ? `A ${kind} is already called “${name.trim()}”.` : item.error.message);
      if (!item.data) return refused("Renaming needs an account that may publish here.");
      publish({ ...library, variants: library.variants.map((v) => (v.id === variant.id ? { ...v, name: name.trim() } : v)), note: "Renamed." });
      return { ok: true };
    },
    async remove() {
      const { db, error } = editor();
      if (error) return error;
      const variant = pickedOf(library);
      if (!variant) return refused("There is no variant to delete.");
      if (variant.version !== null) return refused("A published variant stays: its versions keep it.");
      if (variant.rev !== null) {
        const gone = await db.from("studio_items").delete().eq("id", variant.id).select("id").maybeSingle();
        if (gone.error) return refused(gone.error.message);
        if (!gone.data) return refused("Deleting a variant is the owner's.");
      } else if (his.some((own) => own.id === variant.id)) return refused("A variant in code stays until it is published and copied.");
      const variants = library.variants.filter((v) => v.id !== variant.id);
      const index = library.variants.findIndex((v) => v.id === variant.id);
      publish({ ...library, variants, picked: variants[Math.max(0, index - 1)]?.id ?? "", note: "Deleted." });
      return { ok: true };
    },
    reload: () => load(),
  };
}
