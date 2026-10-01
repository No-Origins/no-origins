"use client";

import * as React from "react";

import { resolveCharacter, type CharacterLook } from "@no-origins/ui/lib/agent-body";
import { UPLOADED, type DrawingData, type FaceSlotId, type FaceWear } from "@no-origins/ui/lib/agent-face";
import type { PropertyValue } from "@no-origins/ui/lib/properties";

import {
  createCharacter,
  loadCharacter,
  publishCharacter,
  restoreCharacter,
  saveDraft,
  uploadDrawing,
  type CharacterState,
  type CharacterVersion,
  type Outcome,
  type UploadedDrawing,
  type CharacterEntry,
  type PublishStep,
} from "@/app/actions";

/**
 * The character being designed, shared by everything round the cell (Character-Studio.md C6): its look, and its draft
 * and versions in the database (`@/app/actions`).
 *
 * **The draft saves as he goes**: a change shows at once, and is saved `SAVE_AFTER` ms after the last one, whole, on the
 * `rev` it was loaded at. A save from another device first is refused, not merged, and the studio says so and offers to
 * load it (`conflict`). **Publishing** saves what is pending first, then makes the draft as it stands a version: the
 * latest's next minor, or the next major (C19). **Going back** to a version makes it the one pages show and the draft
 * its look. **A new character** is made by its name alone, and opens.
 *
 * With no database (a development server with no keys, the review sweep) it is `offline`: the look is the page's alone
 * and nothing is saved.
 */

/** How long after the last change the draft is saved, ms: once a drag is over, not at every step of it. */
const SAVE_AFTER = 500;

export type SaveStatus = "loading" | "saved" | "unsaved" | "saving" | "conflict" | "offline" | "signed-out" | "error";

type Character = {
  look: CharacterLook;
  /** Which character is open, and every one there is (C13); none with no database. */
  characterId: string | null;
  characters: CharacterEntry[];
  /** Open another character: what is pending here is saved first. */
  open: (itemId: string) => Promise<void>;
  status: SaveStatus;
  /** Why the last thing asked of the database did not happen, in words. */
  message: string | null;
  versions: CharacterVersion[];
  currentId: string | null;
  /** The uploaded styles (C8), each at its current version, and every version's shapes by id. */
  drawings: UploadedDrawing[];
  drawingData: Record<string, DrawingData>;
  /** Whether there is a database to publish to. */
  connected: boolean;
  setBody: (id: string, value: PropertyValue) => void;
  setFace: (slot: FaceSlotId, change: (wear: FaceWear) => FaceWear) => void;
  publish: (step: PublishStep) => Promise<boolean>;
  /** Make a character by its name and open it: what is pending here is saved first. The message when it is refused. */
  create: (name: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Keep a cleaned upload as a style of `slot`, and wear it there. The message when it is refused. */
  upload: (slot: FaceSlotId, name: string, file: string, data: DrawingData) => Promise<{ ok: true } | { ok: false; message: string }>;
  restore: (versionId: string) => Promise<boolean>;
  reload: () => Promise<void>;
};

const CharacterContext = React.createContext<Character | null>(null);

export function useCharacter() {
  const character = React.useContext(CharacterContext);
  if (!character) throw new Error("useCharacter outside CharacterProvider");
  return character;
}

/** Version 12 as the code declares it: what the studio shows before the draft has loaded, and with no database. */
const START = resolveCharacter({ body: {}, face: {} });

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [look, setLook] = React.useState<CharacterLook>(START);
  const [status, setStatus] = React.useState<SaveStatus>("loading");
  const [message, setMessage] = React.useState<string | null>(null);
  const [versions, setVersions] = React.useState<CharacterVersion[]>([]);
  const [currentId, setCurrentId] = React.useState<string | null>(null);
  const [characterId, setCharacterId] = React.useState<string | null>(null);
  const [characters, setCharacters] = React.useState<CharacterEntry[]>([]);
  const [drawings, setDrawings] = React.useState<UploadedDrawing[]>([]);
  const [drawingData, setDrawingData] = React.useState<Record<string, DrawingData>>({});

  // What the saver works from: refs, so a save in flight reads the newest look and rev, not the render's.
  const item = React.useRef<string | null>(null);
  const rev = React.useRef(0);
  const latest = React.useRef<CharacterLook>(START);
  const dirty = React.useRef(false);
  const saving = React.useRef<Promise<boolean> | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const halted = React.useRef(false);

  const apply = React.useCallback((state: CharacterState) => {
    item.current = state.itemId;
    setCharacterId(state.itemId);
    setCharacters(state.characters);
    rev.current = state.rev;
    latest.current = state.look;
    dirty.current = false;
    halted.current = false;
    setLook(state.look);
    setVersions(state.versions);
    setCurrentId(state.currentId);
    setDrawings(state.drawings);
    setDrawingData(state.drawingData);
    setStatus("saved");
    setMessage(null);
  }, []);

  const failed = React.useCallback((outcome: Extract<Outcome<unknown>, { ok: false }>) => {
    setMessage(outcome.message);
    if (outcome.reason === "offline") return setStatus("offline");
    if (outcome.reason === "signed-out") return setStatus("signed-out");
    if (outcome.reason === "conflict") {
      // Nothing more is saved over a draft someone else moved: he loads it first.
      halted.current = true;
      return setStatus("conflict");
    }
    setStatus("error");
  }, []);

  const reload = React.useCallback(async () => {
    const outcome = await loadCharacter(item.current ?? undefined);
    if (outcome.ok) apply(outcome.value);
    else failed(outcome);
  }, [apply, failed]);

  React.useEffect(() => {
    // The draft, once, when the studio opens: until it comes, the version the code declares shows.
    let live = true;
    loadCharacter().then((outcome) => {
      if (!live) return;
      if (outcome.ok) apply(outcome.value);
      else failed(outcome);
    });
    return () => {
      live = false;
    };
  }, [apply, failed]);

  /**
   * Save what is pending, one save at a time; a change made while one is in flight is saved after it. True when the
   * draft is saved as it stands.
   */
  const flush = React.useCallback((): Promise<boolean> => {
    if (saving.current) return saving.current;
    if (halted.current) return Promise.resolve(false);
    if (!dirty.current || !item.current) return Promise.resolve(true);
    setStatus("saving");
    const run = (async (): Promise<boolean> => {
      try {
        // A change made while a save is in flight is saved after it, on the rev that save left.
        while (dirty.current) {
          dirty.current = false;
          const outcome = await saveDraft(item.current!, latest.current, rev.current);
          if (!outcome.ok) {
            // Still to save: the next change tries again, or a publish does.
            dirty.current = true;
            failed(outcome);
            return false;
          }
          rev.current = outcome.value.rev;
        }
        setStatus("saved");
        setMessage(null);
        return true;
      } finally {
        saving.current = null;
      }
    })();
    saving.current = run;
    return run;
  }, [failed]);

  const change = React.useCallback(
    (next: (look: CharacterLook) => CharacterLook) => {
      const look = next(latest.current);
      latest.current = look;
      setLook(look);
      // With no database the page is all there is.
      if (!item.current) return;
      dirty.current = true;
      if (!halted.current) setStatus("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_AFTER);
    },
    [flush],
  );

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const setBody = React.useCallback(
    (id: string, value: PropertyValue) => change((l) => ({ ...l, body: { ...l.body, [id]: value } })),
    [change],
  );
  const setFace = React.useCallback(
    (slot: FaceSlotId, edit: (wear: FaceWear) => FaceWear) =>
      change((l) => ({ ...l, face: { ...l.face, [slot]: edit(l.face[slot] ?? { values: {} }) } })),
    [change],
  );

  /** Everything pending saved, before a publish or a going back reads the draft's `rev`. False when it could not be. */
  const settle = React.useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    // A save in flight may leave a newer change to save after it; one that fails stops here.
    while (saving.current || dirty.current) {
      if (!(await flush())) return false;
    }
    return !halted.current;
  }, [flush]);

  const publish = React.useCallback(
    async (step: PublishStep) => {
      if (!item.current || !(await settle())) return false;
      setStatus("saving");
      const outcome = await publishCharacter(item.current, step, rev.current);
      if (!outcome.ok) {
        failed(outcome);
        // A refused publish leaves the draft as it was, saved.
        if (outcome.reason === "refused") setStatus("saved");
        return false;
      }
      apply(outcome.value);
      return true;
    },
    [apply, failed, settle],
  );

  const restore = React.useCallback(
    async (versionId: string) => {
      if (!item.current || !(await settle())) return false;
      setStatus("saving");
      const outcome = await restoreCharacter(item.current, versionId, rev.current);
      if (!outcome.ok) {
        failed(outcome);
        return false;
      }
      apply(outcome.value);
      return true;
    },
    [apply, failed, settle],
  );

  /** Another character: what is pending here is saved first, then its draft and versions take the page (C13). */
  const open = React.useCallback(
    async (itemId: string) => {
      if (itemId === item.current) return;
      if (!(await settle())) return;
      setStatus("loading");
      const outcome = await loadCharacter(itemId);
      if (outcome.ok) apply(outcome.value);
      else failed(outcome);
    },
    [apply, failed, settle],
  );

  /** A new character (C19): what is pending here is saved first, then it is made and takes the page, a draft and no versions. */
  const create = React.useCallback(
    async (name: string) => {
      if (!item.current) return { ok: false as const, message: "Agents are kept in the database, which this server has no keys for." };
      if (!(await settle())) return { ok: false as const, message: "What is pending here could not be saved first." };
      const outcome = await createCharacter(name);
      if (!outcome.ok) return { ok: false as const, message: outcome.message };
      apply(outcome.value);
      return { ok: true as const };
    },
    [apply, settle],
  );

  const upload = React.useCallback(
    async (slot: FaceSlotId, name: string, file: string, data: DrawingData) => {
      if (!item.current) return { ok: false as const, message: "Uploads are kept in the database, which this server has no keys for." };
      const outcome = await uploadDrawing(item.current, slot, name, file, data);
      if (!outcome.ok) return { ok: false as const, message: outcome.message };
      // The drawings as they now are, and the draft as it stands here: what is pending is not thrown away.
      setDrawings(outcome.value.state.drawings);
      setDrawingData(outcome.value.state.drawingData);
      setFace(slot, (w) => ({ ...w, style: `${UPLOADED}${outcome.value.versionId}` }));
      return { ok: true as const };
    },
    [setFace],
  );

  const value = React.useMemo<Character>(
    () => ({
      look,
      characterId,
      characters,
      open,
      status,
      message,
      versions,
      currentId,
      drawings,
      drawingData,
      connected: status !== "offline" && status !== "signed-out" && status !== "loading",
      setBody,
      setFace,
      publish,
      create,
      upload,
      restore,
      reload,
    }),
    [look, characterId, characters, open, status, message, versions, currentId, drawings, drawingData, setBody, setFace, publish, create, upload, restore, reload],
  );
  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}
