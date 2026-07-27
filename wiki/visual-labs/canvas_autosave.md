# Canvas Autosave (Projects)

How the tldraw project canvas persists to Supabase, why the original implementation over-triggered, and the strategy now in place.

Source: [TldrawCanvas.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/projects/TldrawCanvas.tsx) — the "Autosave logic" effect.

---

## 🎯 What it does

Edits to a project's tldraw canvas are auto-persisted to `projects.canvas_data` (JSONB). Publishing a version copies that snapshot into `project_versions.canvas_data`. The HUD shows `SAVING` / `CLOUD SYNCED` / `SYNC ERROR`.

---

## 🐛 Why the original version fired too often

```ts
// before
const cleanup = editor.store.listen(handleStoreChange);   // unscoped
// ...
const snapshot = getSnapshot(editor.store);               // document + session
```

`store.listen` with no filter receives **every** store change, including the *session* scope — camera pan/zoom, selection, hover, pointer, viewport. So merely panning the board or clicking a shape:

1. flipped status to `SAVING`,
2. re-armed the debounce, and
3. eventually shipped the **entire canvas JSON** to Supabase.

`getSnapshot(editor.store)` also captured session state, so camera position and selection were persisted and reloaded — ephemeral data treated as document data. Programmatic mutations (including the initial `loadSnapshot`) counted as changes too.

---

## ✅ Strategy now in place

```ts
// Persist only user-driven, document-scoped changes.
editor.store.listen(handleStoreChange, { source: "user", scope: "document" });

// Persist only document records — never camera/selection/session.
const snapshot = editor.store.getStoreSnapshot("document");
```

| Strategy | Mechanism | Effect |
|----------|-----------|--------|
| **Scoped listener** | `{ source: "user", scope: "document" }` | Camera, selection, hover, and remote/programmatic changes no longer trigger saves — the primary fix |
| **Document-only snapshot** | `store.getStoreSnapshot("document")` | Ephemeral session state is never persisted or reloaded |
| **Debounce + max-wait** | 2 s debounce, 15 s ceiling | A burst of edits collapses to one write; a long uninterrupted edit still flushes every 15 s instead of waiting for a pause |
| **Dirty check** | compare `JSON.stringify(snapshot)` against `lastSavedRef` | No-op writes that survive scoping are skipped entirely |
| **Stable deps** | `initialCanvasData` captured in a ref; effect deps `[editor, projectId]` | Listener no longer re-registers when the parent re-renders with a fresh prop reference |

### Backward compatibility
`getStoreSnapshot("document")` returns a `TLStoreSnapshot` (`{ store, schema }`) rather than the old `TLEditorSnapshot` (`{ document, session }`). `editor.loadSnapshot()` accepts **both** shapes, so canvases saved under the old format still load. No migration needed.

---

## 👁️ Public Read-Only Viewing (`isReadOnly` Mode)

Unauthenticated visitors and non-owner users viewing published projects (`is_published = true`) at `/projects/[id]` open the workspace in read-only mode:

1. **Snapshot Load Unblocked**: The canvas data snapshot is always loaded into the store via `loadSnapshot()` regardless of `isReadOnly`. (An earlier bug returned early before loading when `isReadOnly` was true, causing published canvases to display blank for viewers).
2. **Autosave Listener Guarded**: The store change listener and write loop are strictly gated on `!isReadOnly`. Read-only viewers make no Supabase persistence calls.
3. **Auto-Framing (`zoomToFit`)**: On initial snapshot load, if `isReadOnly` is active, the canvas automatically executes `editor.zoomToFit({ animation: { duration: 300 } })`. This ensures public viewers open framed cleanly on the existing content rather than looking at a blank corner of the infinity canvas.


---

## 🔭 Deferred (not yet implemented)

- **Incremental diff persistence.** Each `store.listen` callback receives a `HistoryEntry` with the exact `RecordsDiff`. Persisting diffs instead of the full document would cut write payload as boards grow. This is an architectural change to the persistence model (append-only diffs + periodic compaction) and is intentionally out of scope for the over-triggering fix.
- **Hashing instead of full serialization** for the dirty check, if `JSON.stringify` of large snapshots ever shows up in profiles.

---

## 🔗 Related

- [State Management & Synchronization](Wikis/no-origins/visual-labs/state_sync.md)
- Schema: `supabase/migrations/0002_projects_feature.sql` — `projects.canvas_data`, `project_versions.canvas_data`
