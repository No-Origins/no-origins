"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Chip, Dialog, Field, Label, SectionHeader, Segmented, Text, ThemeSwitch, ToolScreen, Tree, type TreeNode } from "@no-origins/ui";
import { CanvasShell, useCanvasZoom, type SceneNode } from "@no-origins/ui/canvas";
import { useReactFlow } from "@xyflow/react";
import { documentToScene, type Issue, type SceneDocument } from "@no-origins/ui/document";
import { CanvasOverlay, DocumentForm, PALETTE_MIME, Palette, PropsForm, SaveState, freshProps, type Ghost, type OverlayBox, type SaveStatus, type Selected } from "@no-origins/ui/editor";
import { registry } from "@no-origins/ui/registry";
import type { Hue } from "@no-origins/ui";
import { contentKeys, portfolioContent } from "@/content/portfolio";

/**
 * The editor (Admin.md §6, §6.5c) — the draft in React state, the adapter between it and the canvas, and a
 * debounced PATCH between it and the row.
 *
 * **One direction.** Every gesture edits the DOCUMENT; `documentToScene` renders it; the canvas draws what comes
 * back. Nothing writes to the canvas and reads it later, which is why an inspector keystroke and a palette drop
 * and an outline reorder are all the same three lines — and why the adapter's `issues` are always about what is
 * on screen rather than about what was on screen a moment ago.
 *
 * **Zero utility classes** (Atomic.md rule 5): the admin composes the package and styles nothing. Every visual
 * here is a package component or a package class; where one did not exist it was built in `@no-origins/ui/editor`,
 * not here.
 *
 * What is NOT built: Preview (step 8) and Publish (step 8). The Publish dialog asks for R1's required version
 * label and then closes, and says so on the button rather than pretending.
 */
const SAVE_DEBOUNCE = 800;

type Node = SceneDocument["nodes"][number];

/** Where a freshly dropped component lands, in boxes. A widget is 4 × 3 by design (Design-System.md §8.3). */
const SIZE_IN_BOXES: Record<string, [number, number]> = { widget: [4, 3], panel: [3, 2], region: [4, 1], menu: [1, 2] };

const HOSTS: ReadonlyArray<"widget" | "panel" | "blob" | "region"> = ["widget", "panel", "blob", "region"];

/** What the bar's zoom controls drive. Lifted out of the canvas, because the bar is outside it. */
interface Tools {
  in: () => void;
  out: () => void;
  fit: () => void;
  /** Bring one node under the viewport — what picking a row in the outline has to do to mean anything. */
  focus: (id: string) => void;
}

/** The editor opens close enough to read a widget, never at the map's minimum where every tag is hidden. */
const EDITOR_FIT = { padding: 0.2, minZoom: 0.5, maxZoom: 0.9 };

/**
 * Rendered inside the flow, so it can see the viewport: it reports the zoom up for the bar's readout, hands the
 * bar its three controls, and lands the editor at a working zoom. The shell fits every node on mount, which for
 * a ring this wide inside a column between a sidebar and an inspector is 0.15 — the map tier, where the canvas
 * is a picture of a canvas. So this re-fits once, after the shell's own landing.
 */
function CanvasTools({ onZoom, onReady }: { onZoom: (z: number) => void; onReady: (tools: Tools) => void }) {
  const zoom = useCanvasZoom();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  useEffect(() => onZoom(zoom), [zoom, onZoom]);
  useEffect(() => {
    onReady({
      in: () => void zoomIn(),
      out: () => void zoomOut(),
      // Fit means fit: no floor, even though below 0.4 the tags hide — that is the map tier doing its job (§8.4).
      fit: () => void fitView({ padding: 0.2, maxZoom: 0.9 }),
      focus: (id) => void fitView({ nodes: [{ id }], padding: 0.55, minZoom: 0.4, maxZoom: 0.9, duration: 320 }),
    });
  }, [onReady, zoomIn, zoomOut, fitView]);
  useEffect(() => {
    const id = setTimeout(() => void fitView({ ...EDITOR_FIT, duration: 0 }), 400);
    return () => clearTimeout(id);
  }, [fitView]);
  return null;
}

export interface EditorProps {
  documentId: string;
  projectName: string;
  title: string;
  rev: number;
  savedAt: string | null;
  draft: SceneDocument;
}

export function Editor({ documentId, projectName, title, rev: loadedRev, savedAt: loadedAt, draft }: EditorProps) {
  const [doc, setDoc] = useState<SceneDocument>(draft);
  const [selected, setSelected] = useState<string[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [savedAt, setSavedAt] = useState<string | null>(loadedAt);
  const [zoom, setZoom] = useState(1);
  const [rev, setRev] = useState(loadedRev);
  const tools = useRef<Tools | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "phone">("desktop");
  const [grid, setGrid] = useState<"on" | "off">("on");
  const [publishing, setPublishing] = useState(false);
  const [label, setLabel] = useState("");

  const docRef = useRef(doc);
  const revRef = useRef(loadedRev);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef<string | null>(null);

  /* ── the draft, and the save (§6.4) ──────────────────────────────────────────────────────────────────────── */

  const push = useCallback(
    async (next: SceneDocument) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/documents/${documentId}/draft`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rev: revRef.current, draft: next }),
        });
        // 409 is the rev check refusing a stale write. It is not an error to retry: the draft here is behind.
        if (res.status === 409) return setStatus("stale");
        if (!res.ok) return setStatus("failed");
        const body = (await res.json()) as { rev: number; savedAt: string | null };
        revRef.current = body.rev;
        setRev(body.rev);
        setSavedAt(body.savedAt);
        setStatus("saved");
      } catch {
        setStatus("failed");
      }
    },
    [documentId],
  );

  /** The one way the document changes. Immutable, and every call restarts the debounce. */
  const edit = useCallback(
    (fn: (d: SceneDocument) => SceneDocument) => {
      const next = fn(docRef.current);
      docRef.current = next;
      setDoc(next);
      setStatus("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void push(next), SAVE_DEBOUNCE);
    },
    [push],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* ── the scene the canvas draws ──────────────────────────────────────────────────────────────────────────── */

  const result = useMemo(() => documentToScene(doc, registry, { content: portfolioContent }), [doc]);
  const scene = result.scene as SceneNode[];
  const box = doc.grid?.box ?? 160;
  const snap = (n: number) => Math.round(n / box) * box;

  const nodeById = useMemo(() => new Map(doc.nodes.map((n) => [n.id, n] as const)), [doc.nodes]);

  const boxes: OverlayBox[] = useMemo(
    () =>
      scene.map((s) => {
        const n = nodeById.get(s.id);
        const w = s.kind === "blob" ? 72 : s.width;
        const h = s.kind === "blob" ? 48 : s.height;
        const props = n?.props && !("$ref" in n.props) ? (n.props as Record<string, unknown>) : {};
        return { id: s.id, x: s.position.x, y: s.position.y, w, h, kind: s.kind, name: n?.component ?? s.kind, hue: (props.hue as Hue | undefined) ?? "accent" };
      }),
    [scene, nodeById],
  );

  /* ── the selection ───────────────────────────────────────────────────────────────────────────────────────── */

  const selection: Selected[] = useMemo(
    () =>
      selected
        .map((id) => nodeById.get(id))
        .filter((n): n is Node => Boolean(n?.component && registry[n.component!]))
        .map((n) => ({ entry: registry[n.component!]!, props: n.props && !("$ref" in n.props) ? (n.props as Record<string, unknown>) : {} })),
    [selected, nodeById],
  );

  const patchProps = useCallback(
    (patch: Record<string, unknown>) =>
      edit((d) => ({
        ...d,
        nodes: d.nodes.map((n) => {
          if (!selected.includes(n.id)) return n;
          const props = { ...(n.props && !("$ref" in n.props) ? n.props : {}), ...patch };
          for (const k of Object.keys(props)) if (props[k] === undefined) delete props[k];
          return { ...n, props };
        }),
      })),
    [edit, selected],
  );

  const move = useCallback(
    (id: string, at: [number, number]) => edit((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, at } : n)) })),
    [edit],
  );

  /* ── placing, deleting, duplicating ──────────────────────────────────────────────────────────────────────── */

  const uniqueId = (base: string, d: SceneDocument) => {
    const taken = new Set(d.nodes.map((n) => n.id));
    let i = 1;
    let id = `${base}-${i}`;
    while (taken.has(id)) id = `${base}-${++i}`;
    return id;
  };

  const place = useCallback(
    (name: string, at: [number, number]) => {
      const entry = registry[name];
      if (!entry) return;
      const kind = HOSTS.find((k) => entry.kind.includes(k));
      if (!kind) {
        setNotice(`${name} goes inside another component, not on the canvas — select one and use its slots.`);
        return;
      }
      const [w, h] = SIZE_IN_BOXES[kind] ?? [2, 2];
      edit((d) => {
        const id = uniqueId(entry.name.toLowerCase(), d);
        const node: Node = {
          id,
          kind,
          component: entry.name,
          at: [snap(at[0]), snap(at[1])],
          props: { ...entry.defaults, ...freshProps(entry.props) },
          ...(kind === "blob" ? {} : { size: [w * box, h * box] as [number, number] }),
          ...(kind === "widget" ? { node: { view: id } } : {}),
          ...(kind === "region" ? { node: { label: entry.name } } : {}),
        };
        return { ...d, nodes: [...d.nodes, node] };
      });
      setSelected([]);
      setNotice(null);
      // The new node's id is only known inside the updater, so select it on the next document.
      requestAnimationFrame(() => setSelected([docRef.current.nodes[docRef.current.nodes.length - 1]!.id]));
    },
    [edit, box],
  );

  const remove = useCallback(() => {
    if (!selected.length) return;
    edit((d) => ({
      ...d,
      nodes: d.nodes.filter((n) => !selected.includes(n.id)),
      views: (d.views ?? []).map((v) => ({ ...v, nodeIds: v.nodeIds.filter((id) => !selected.includes(id)) })).filter((v) => v.nodeIds.length),
      threads: (d.threads ?? []).filter((t) => !selected.includes(t.from) && !selected.includes(t.to)),
    }));
    setSelected([]);
  }, [edit, selected]);

  const duplicate = useCallback(() => {
    if (!selected.length) return;
    edit((d) => {
      const copies: Node[] = [];
      let next = d;
      for (const id of selected) {
        const n = d.nodes.find((x) => x.id === id);
        if (!n) continue;
        const copy: Node = { ...n, id: uniqueId(n.id.replace(/-\d+$/, ""), next), at: n.at ? [n.at[0] + box, n.at[1] + box] : undefined };
        copies.push(copy);
        next = { ...next, nodes: [...next.nodes, copy] };
      }
      return { ...d, nodes: [...d.nodes, ...copies] };
    });
  }, [edit, selected, box]);

  /* ── the keyboard (§6.5c S2 D, and the editor's own three) ───────────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "Escape") return setSelected([]);
      if (!selected.length) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        return remove();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        return duplicate();
      }
      const step: Record<string, [number, number]> = { ArrowLeft: [-box, 0], ArrowRight: [box, 0], ArrowUp: [0, -box], ArrowDown: [0, box] };
      const d = step[e.key];
      if (!d) return;
      e.preventDefault();
      for (const id of selected) {
        const n = docRef.current.nodes.find((x) => x.id === id);
        if (n?.at) move(id, [n.at[0] + d[0], n.at[1] + d[1]]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, remove, duplicate, move, box]);

  // What is being dragged is only readable on drop, so the ghost's size is learned from the item that started it.
  useEffect(() => {
    const onStart = (e: globalThis.DragEvent) => {
      dragging.current = (e.target as HTMLElement | null)?.dataset?.component ?? null;
    };
    const onEnd = () => { dragging.current = null; setGhost(null); };
    window.addEventListener("dragstart", onStart);
    window.addEventListener("dragend", onEnd);
    return () => {
      window.removeEventListener("dragstart", onStart);
      window.removeEventListener("dragend", onEnd);
    };
  }, []);

  /* ── the outline (§6.1: DOM order IS reading order and tab order) ────────────────────────────────────────── */

  const outline: TreeNode[] = useMemo(() => {
    const loose = doc.nodes.filter((n) => !n.section);
    const sections = (doc.order ?? []).filter((s) => doc.nodes.some((n) => n.section === s));
    const row = (n: Node): TreeNode => ({ id: n.id, label: `${n.component ?? n.kind} · ${n.id}` });
    return [
      ...loose.map(row),
      ...sections.map((s) => ({ id: `section:${s}`, label: s, children: doc.nodes.filter((n) => n.section === s).map(row) })),
    ];
  }, [doc]);

  const onReorder = useCallback(
    (nodes: TreeNode[]) => {
      edit((d) => {
        const order: string[] = [];
        const out: Node[] = [];
        const take = (id: string, section?: string) => {
          const n = d.nodes.find((x) => x.id === id);
          if (n) out.push(section ? { ...n, section } : { ...n, section: undefined });
        };
        for (const row of nodes) {
          if (row.id.startsWith("section:")) {
            const s = row.id.slice("section:".length);
            order.push(s);
            for (const kid of row.children ?? []) take(kid.id, s);
          } else {
            take(row.id);
          }
        }
        for (const n of d.nodes) if (!out.some((o) => o.id === n.id)) out.push(n);
        return { ...d, nodes: out, order };
      });
    },
    [edit],
  );

  /* ── the render ──────────────────────────────────────────────────────────────────────────────────────────── */

  const path = (i: number) => `nodes.${i}`;
  const shownIssues: Issue[] = useMemo(() => {
    if (!selected.length) return result.issues;
    const prefixes = selected.map((id) => path(doc.nodes.findIndex((n) => n.id === id)));
    return result.issues.filter((i) => prefixes.some((p) => i.path === p || i.path.startsWith(`${p}.`)));
  }, [result.issues, selected, doc.nodes]);

  const hue = (selection[0] && (selection[0].props.hue as Hue | undefined)) ?? "accent";
  const canPublish = status === "saved" && result.valid;

  return (
    <ToolScreen
      eyebrow="Projects"
      title={`${projectName} · ${title}`}
      flush
      meta={
        <>
          <Chip hue="grey">draft</Chip>
          <SaveState
            status={status}
            when={status === "saved" && savedAt ? new Date(savedAt).toLocaleTimeString() : status === "stale" && savedAt ? new Date(savedAt).toLocaleTimeString() : undefined}
            onRetry={() => void push(docRef.current)}
            onReload={() => window.location.reload()}
          />
        </>
      }
      actions={
        <>
          <Button variant="ghost" size="sm" as={Link} href="/projects/portfolio">Project</Button>
          <Button variant="secondary" size="sm" disabled title="The draft behind auth — step 8">Preview</Button>
          <Button size="sm" disabled={!canPublish} onClick={() => setPublishing(true)} title={canPublish ? undefined : result.valid ? "Publish is enabled only when the draft is saved" : "The document has errors"}>
            Publish
          </Button>
        </>
      }
      sidebar={
        <>
          <Palette onPlace={(entry) => place(entry.name, [snap(0), snap(0)])} />
          <SectionHeader level={4} rhythm={false} label="outline" title="Reading order" lead="DOM order is tab order (§12). Alt + ↑/↓ moves a row; Alt + ←/→ changes its depth." />
          <Tree
            label="Outline"
            nodes={outline}
            selected={selected[0]}
            defaultExpanded={(doc.order ?? []).map((s) => `section:${s}`)}
            onSelect={(id) => {
              if (id.startsWith("section:")) return setSelected([]);
              setSelected([id]);
              tools.current?.focus(id);
            }}
            onReorder={onReorder}
          />
        </>
      }
      inspector={
        selection.length ? (
          <PropsForm
            selection={selection}
            onChange={patchProps}
            hue={hue}
            contentKeys={contentKeys()}
            patterns={doc.patterns ?? {}}
            onPatternCreate={(option) => edit((d) => ({ ...d, patterns: { ...(d.patterns ?? {}), [option.name]: option.family } }))}
            foot={<Issues issues={shownIssues} notice={notice} />}
          />
        ) : (
          <>
            <DocumentForm doc={doc} onChange={(patch) => edit((d) => ({ ...d, ...patch }))} />
            <Issues issues={shownIssues} notice={notice} />
          </>
        )
      }
      bar={
        <>
          <Segmented label="Viewport" options={[{ value: "desktop", label: "Desktop" }, { value: "phone", label: "Phone" }]} value={viewport} onChange={setViewport} />
          <Segmented label="Grid" options={[{ value: "on", label: "Grid" }, { value: "off", label: "Off" }]} value={grid} onChange={setGrid} />
          <Button variant="ghost" size="sm" onClick={() => tools.current?.out()} aria-label="Zoom out">−</Button>
          <Text size="small" tone="muted" as="span">zoom {zoom.toFixed(2)}</Text>
          <Button variant="ghost" size="sm" onClick={() => tools.current?.in()} aria-label="Zoom in">+</Button>
          <Button variant="ghost" size="sm" onClick={() => tools.current?.fit()}>Fit</Button>
          <Text size="small" tone="muted" as="span">{doc.nodes.length} nodes · rev {rev}</Text>
          <ThemeSwitch />
        </>
      }
    >
      <CanvasShell
        className={`noo-ecanvas${viewport === "phone" ? " noo-ecanvas--phone" : ""}${grid === "off" ? " noo-ecanvas--nogrid" : ""}`}
        scene={scene}
        views={result.views}
        threads={result.threads}
        heading={`${projectName} — ${title}, in the editor`}
        minimap={false}
        selectedId={selected[0] ?? null}
        onSelect={(id) => {
          setSelected(id ? [id] : []);
          setNotice(null);
        }}
        onNodeMove={(id, at) => move(id, [snap(at.x), snap(at.y)])}
        onCanvasDragOver={(point) => {
          const name = dragging.current;
          const entry = name ? registry[name] : undefined;
          const kind = entry && HOSTS.find((k) => entry.kind.includes(k));
          const [w, h] = (kind && SIZE_IN_BOXES[kind]) ?? [2, 2];
          setGhost({ x: snap(point.x), y: snap(point.y), w: w * box, h: h * box, label: name ?? undefined });
        }}
        onCanvasDragLeave={() => setGhost(null)}
        onCanvasDrop={(point, event) => {
          const name = event.dataTransfer.getData(PALETTE_MIME) || dragging.current;
          setGhost(null);
          if (name) place(name, [point.x, point.y]);
        }}
        overlay={<CanvasOverlay boxes={boxes} selected={selected} hovered={hovered} ghost={ghost} />}
      >
        <CanvasTools onZoom={setZoom} onReady={(t) => { tools.current = t; }} />
      </CanvasShell>

      <Dialog
        open={publishing}
        onClose={() => setPublishing(false)}
        title="Publish"
        description="A version is an integer and a required label (R1) — the label is the moment you notice what you actually changed."
        actions={
          <>
            <Button variant="ghost" onClick={() => setPublishing(false)}>Cancel</Button>
            <Button disabled={!label.trim()} onClick={() => { setPublishing(false); setLabel(""); }}>
              Close — publishing is step 8
            </Button>
          </>
        }
      >
        <Field label="Version label" value={label} placeholder="Roadmap, honest counts" hint="Required. Says what changed, in your own words." onChange={(e) => setLabel(e.currentTarget.value)} />
        <Text size="small" tone="muted">
          Nothing is written yet. The version row, the pointer move, the revalidate webhook and the read-back are Admin.md §13 step 8.
        </Text>
      </Dialog>
      {/* hover is a canvas gesture, and the shell has no hover callback — the overlay reads it from the node under the pointer */}
      <HoverProbe onHover={setHovered} />
    </ToolScreen>
  );
}

/** The adapter's report, for the selection or for the whole document (§3.3: nothing is ever dropped silently). */
function Issues({ issues, notice }: { issues: readonly Issue[]; notice: string | null }) {
  if (!issues.length && !notice) return <Text size="small" tone="muted">No issues here.</Text>;
  return (
    <>
      {notice ? <Text size="small">{notice}</Text> : null}
      {issues.map((i) => (
        <Text key={`${i.path}:${i.message}`} size="small" tone="muted">
          <Chip hue={i.level === "error" ? "pink" : "yellow"}>{i.level}</Chip> <Label as="span">{i.path}</Label> {i.message}
        </Text>
      ))}
    </>
  );
}

/**
 * Hover, for S1's 1px hairline. React Flow has no `onNodeMouseEnter` that survives the overlay sitting over the
 * nodes, so this listens on the canvas and reads the node id off the DOM — the same `data-id` the shell's own
 * keyboard handler uses.
 */
function HoverProbe({ onHover }: { onHover: (id: string | null) => void }) {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(".react-flow__node") as HTMLElement | null;
      onHover(el?.getAttribute("data-id") ?? null);
    };
    const canvas = document.querySelector(".noo-ecanvas");
    canvas?.addEventListener("mousemove", onMove as EventListener);
    return () => canvas?.removeEventListener("mousemove", onMove as EventListener);
  }, [onHover]);
  return null;
}
