import { createElement, type ComponentType, type ReactNode } from "react";
import { Placeholder } from "../atoms/Placeholder";
import { patternNames as libraryPatternNames } from "../atoms/patterns/patterns";
import type { Registry, RegistryEntry, SlotSpec } from "../registry/types";
import type { Hue } from "../tokens/tokens";
import type { BlobSceneNode, CanvasView, MenuSceneNode, PanelSceneNode, RegionSceneNode, SceneNode, SceneThread, WidgetSceneNode } from "../templates/canvas/scene";
import { markdown } from "./markdown";
import { isRef, present, resolveDeep, resolveRef, type RefSite, type Unresolved } from "./refs";
import { schemaFor } from "./props";
import { documentSchema, type DocumentNodeKind, type ParsedDocument, type ParsedDocumentNode, type SlotChild } from "./schema";

/**
 * The adapter (Scene-Schema.md §4): a document in, the `SceneNode[]` that `CanvasShell` already takes out. It
 * resolves each node's `component` against the registry, resolves refs against the project's content, validates
 * `props` against the entry's schema, renders the component into `content`, and emits nodes in reading order —
 * `order` by section, array order within one, and never by position (§1.2). The output is exactly what the
 * portfolio's `scene.tsx` hand-writes, so the shell cannot tell the two apart and a canvas may be half document and
 * half source during a migration.
 *
 * Nothing is ever dropped silently (§3.3). A node that fails renders a visible `Placeholder` marked draft that says
 * what went wrong, and every problem is also in `issues` — the editor's list, and what blocks Publish (§6).
 *
 * `page` nodes are not in canvas space (Design-System.md §8.4) and come back separately as `pages`, rendered and
 * ready for their own route.
 */
export interface Issue {
  level: "error" | "warn";
  /** Where: `nodes.3.props.hue`, `views.0.nodeIds.1`. */
  path: string;
  message: string;
}

export interface DocumentPage {
  id: string;
  section?: string;
  label?: string;
  content: ReactNode;
}

export interface DocumentContext {
  /** The project's content, which refs resolve against (§3.4). The host owns it; the adapter reads it. */
  content?: unknown;
  /**
   * Does this ref path name copy the host filled from a sample? (Admin.md §6.5c F4.) A node whose props read one
   * renders the *sample copy* tag first and says so in `issues`. Only the host knows — which is also why a
   * document that INLINES sampled text cannot be tagged: sampled copy lives in content and is reached by ref.
   */
  sampled?: (path: string) => boolean;
}

export interface SceneFromDocument {
  /** False when the document failed the shape check or any node failed validation: publish is blocked (§6). */
  valid: boolean;
  scene: SceneNode[];
  views: CanvasView[];
  threads: SceneThread[];
  pages: DocumentPage[];
  issues: Issue[];
}

/** Slots rendered as the component's `children`; any other slot name becomes a prop of that name. */
const CHILD_SLOTS = new Set(["children", "body", "content", "cells", "panels"]);

interface Ctx {
  doc: ParsedDocument;
  registry: Registry;
  content: unknown;
  sampled?: (path: string) => boolean;
  patternNames: readonly string[];
  issues: Issue[];
  viewHref: (view: string) => string | undefined;
}

const error = (ctx: Ctx, path: string, message: string) => ctx.issues.push({ level: "error", path, message });
const warn = (ctx: Ctx, path: string, message: string) => ctx.issues.push({ level: "warn", path, message });

function errorNode(title: string, message: string): ReactNode {
  return (
    <Placeholder draft title={title}>
      {message}
    </Placeholder>
  );
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

interface Prepared {
  /** The authored props, resolved and validated — before `adapt`, so a child can read its parent's. */
  authored: Record<string, unknown>;
  /** What the component receives. */
  props: Record<string, unknown>;
  children: ReactNode[];
}

/**
 * Resolves, validates and prepares one component's props and slots. Returns `null` when `when` says no, and an
 * error element when the node cannot render.
 */
function prepare(child: SlotChild, entry: RegistryEntry, path: string, ctx: Ctx, parent?: Record<string, unknown>): Prepared | { element: ReactNode } | null {
  if (child.when && !present(resolveRef(child.when.$ref, ctx.content))) return null;

  let raw: unknown = child.props ?? {};
  if (isRef(raw)) {
    raw = resolveRef(raw.$ref, ctx.content);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      error(ctx, `${path}.props`, `props ref names no object`);
      return { element: errorNode(`${entry.name}: not rendered`, "its props ref names nothing") };
    }
  }
  const unresolved: Unresolved[] = [];
  const read: RefSite[] = [];
  const resolved = resolveDeep(raw, ctx.content, `${path}.props`, unresolved, read) as Record<string, unknown>;
  for (const u of unresolved) warn(ctx, u.path, `ref "${u.ref}" names nothing`);
  const sampled = ctx.sampled ? read.filter((r) => ctx.sampled!(r.ref)) : [];
  for (const r of sampled) warn(ctx, r.path, `props read sampled copy: ${r.ref}`);
  for (const k of Object.keys(resolved)) if (resolved[k] === undefined) delete resolved[k];

  const parsed = schemaFor(entry, { patternNames: ctx.patternNames }).safeParse(resolved);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => `${i.path.join(".") || "props"}: ${i.message}`);
    for (const m of messages) error(ctx, `${path}.props`, m);
    return { element: errorNode(`${entry.name}: not rendered`, messages.join(" · ")) };
  }
  const authored = parsed.data;
  const props: Record<string, unknown> = { ...authored };
  const children: ReactNode[] = [];
  for (const [name, spec] of Object.entries(entry.props)) {
    if (spec.deprecated && name in props) {
      warn(ctx, `${path}.props.${name}`, `${entry.name}.${name} is deprecated: ${spec.deprecated}`);
      delete props[name];
    }
  }

  for (const [name, spec] of Object.entries(entry.props)) {
    const value = props[name];
    if (spec.type === "pattern" && typeof value === "string" && ctx.doc.patterns[value]) props[name] = ctx.doc.patterns[value];
    if (spec.type === "markdown" && typeof value === "string") {
      const r = markdown(value, { viewHref: ctx.viewHref });
      if (entry.childrenFrom === name) {
        children.push(r.nodes);
        delete props[name];
        // `Text` is a <p>; block content needs a div. The one component the rule is written for.
        if (r.block && entry.name === "Text") Object.assign(props, { as: "div", className: "noo-text--blocks" });
      } else {
        props[name] = r.block ? <div className="noo-text--blocks">{r.nodes}</div> : r.nodes;
      }
    }
  }
  if (entry.childrenFrom && entry.childrenFrom in props) {
    children.push(props[entry.childrenFrom] as ReactNode);
    delete props[entry.childrenFrom];
  }

  for (const [slotName, kids] of Object.entries(child.slots ?? {})) {
    const spec: SlotSpec | undefined = entry.slots?.[slotName];
    if (!spec) {
      error(ctx, `${path}.slots.${slotName}`, `${entry.name} has no slot "${slotName}"`);
      continue;
    }
    if (spec.min !== undefined && kids.length < spec.min) warn(ctx, `${path}.slots.${slotName}`, `wants at least ${spec.min}`);
    if (spec.max !== undefined && kids.length > spec.max) warn(ctx, `${path}.slots.${slotName}`, `takes at most ${spec.max}`);
    const elements: ReactNode[] = [];
    kids.forEach((kid, i) => {
      const kidPath = `${path}.slots.${slotName}.${i}`;
      const kidEntry = ctx.registry[kid.component];
      if (!kidEntry) {
        error(ctx, kidPath, `"${kid.component}" is not in the registry`);
        elements.push(<Placeholder key={kid.id ?? i} draft title={`${kid.component} is not in the registry`}>A document may only name components the registry exports (§2).</Placeholder>);
        return;
      }
      const admitted = spec.admits === "blocks" ? kidEntry.kind.includes("slot") : spec.admits.includes(kid.component);
      if (!admitted) error(ctx, kidPath, `${entry.name}.${slotName} does not admit ${kid.component}`);
      const el = renderChild(kid, kidEntry, kidPath, ctx, authored, kid.id ?? String(i));
      if (el !== null) elements.push(el);
    });
    if (CHILD_SLOTS.has(slotName)) children.push(...elements);
    else props[slotName] = spec.max === 1 ? elements[0] : elements;
  }

  // The tag goes FIRST, above the words it is about — the cell's own top-left, as the hand-written widgets have it.
  if (sampled.length) children.unshift(<span key="sampled" className="noo-placeholder__tag noo-sample-tag">sample copy</span>);

  return { authored, props: entry.adapt ? entry.adapt(props, parent) : props, children };
}

function renderChild(child: SlotChild, entry: RegistryEntry, path: string, ctx: Ctx, parent: Record<string, unknown> | undefined, key: string): ReactNode {
  const p = prepare(child, entry, path, ctx, parent);
  if (p === null) return null;
  if ("element" in p) return <span key={key}>{p.element}</span>;
  const Component = entry.component as unknown as ComponentType<Record<string, unknown>>;
  return createElement(Component, { ...p.props, key }, ...p.children);
}

/** A top-level node's component, rendered. `hosted` is the node kind, checked against the entry's `kind`. */
function renderNode(n: ParsedDocumentNode, path: string, ctx: Ctx, hosted: DocumentNodeKind): { element: ReactNode; authored: Record<string, unknown> } | null {
  const name = n.component!;
  const entry = ctx.registry[name];
  if (!entry) {
    error(ctx, `${path}.component`, `"${name}" is not in the registry`);
    return { element: errorNode(`${name} is not in the registry`, "A document may only name components the registry exports (§2)."), authored: {} };
  }
  if (!(entry.kind as readonly string[]).includes(hosted)) error(ctx, `${path}.component`, `${name} may not be hosted by a ${hosted} node (§6 rule 1)`);
  const p = prepare({ component: name, props: n.props, slots: n.slots }, entry, path, ctx);
  if (p === null) return null;
  if ("element" in p) return { element: p.element, authored: {} };
  const Component = entry.component as unknown as ComponentType<Record<string, unknown>>;
  return { element: createElement(Component, p.props, ...p.children), authored: p.authored };
}

/** §6: the structural rules — ids, refs, order, box alignment, overlap. Rendering handles the per-node ones. */
function checkStructure(ctx: Ctx) {
  const { doc } = ctx;
  const ids = new Set<string>();
  doc.nodes.forEach((n, i) => {
    if (ids.has(n.id)) error(ctx, `nodes.${i}.id`, `duplicate id "${n.id}" (§6 rule 3)`);
    ids.add(n.id);
  });
  doc.views.forEach((v, i) => v.nodeIds.forEach((id, j) => { if (!ids.has(id)) error(ctx, `views.${i}.nodeIds.${j}`, `"${id}" is not a node (§6 rule 4)`); }));
  doc.threads.forEach((t, i) => {
    if (!ids.has(t.from)) error(ctx, `threads.${i}.from`, `"${t.from}" is not a node (§6 rule 4)`);
    if (!ids.has(t.to)) error(ctx, `threads.${i}.to`, `"${t.to}" is not a node (§6 rule 4)`);
  });
  const sections = new Set(doc.nodes.map((n) => n.section).filter((s): s is string => Boolean(s)));
  for (const s of sections) if (!doc.order.includes(s)) error(ctx, "order", `section "${s}" has nodes and is not in order (§6 rule 5)`);
  for (const s of doc.order) if (!sections.has(s)) warn(ctx, "order", `section "${s}" is in order and has no nodes`);

  const box = doc.grid.box;
  const quantised = doc.nodes.filter((n) => (n.kind === "widget" || n.kind === "region") && n.at && n.size);
  quantised.forEach((n) => {
    const i = doc.nodes.indexOf(n);
    const [x, y] = n.at!;
    const [w, h] = n.size!;
    if (x % box || y % box || w % box || (h ?? 0) % box) error(ctx, `nodes.${i}.at`, `a ${n.kind} lands on box corners: ${x}, ${y} · ${w} × ${h} against a box of ${box} (§6 rule 7)`);
  });
  for (let a = 0; a < quantised.length; a++) {
    for (let b = a + 1; b < quantised.length; b++) {
      const A = quantised[a]!;
      const B = quantised[b]!;
      const [ax, ay] = A.at!;
      const [aw, ah] = A.size!;
      const [bx, by] = B.at!;
      const [bw, bh] = B.size!;
      if (ax < bx + bw && bx < ax + aw && ay < by + (bh ?? 0) && by < ay + (ah ?? 0)) error(ctx, `nodes.${doc.nodes.indexOf(B)}.at`, `"${B.id}" overlaps "${A.id}" (§6 rule 7)`);
    }
  }
}

/** Reading order (§1.2): nodes with no section first, in array order; then each section in `order`, in array order. */
function inOrder(doc: ParsedDocument): ParsedDocumentNode[] {
  const out = doc.nodes.filter((n) => !n.section);
  for (const s of doc.order) out.push(...doc.nodes.filter((n) => n.section === s));
  for (const n of doc.nodes) if (n.section && !doc.order.includes(n.section)) out.push(n);
  return out;
}

export function documentToScene(input: unknown, registry: Registry, context: DocumentContext = {}): SceneFromDocument {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) {
    const issues: Issue[] = parsed.error.issues.map((i) => ({ level: "error", path: i.path.join("."), message: i.message }));
    return { valid: false, scene: [], views: [], threads: [], pages: [], issues };
  }
  const doc = parsed.data;
  const ctx: Ctx = {
    doc,
    registry,
    content: context.content,
    sampled: context.sampled,
    patternNames: [...libraryPatternNames, ...Object.keys(doc.patterns)],
    issues: [],
    viewHref: (view) => doc.views.find((v) => v.id === view)?.href,
  };
  checkStructure(ctx);

  const scene: SceneNode[] = [];
  const pages: DocumentPage[] = [];
  for (const n of inOrder(doc)) {
    const path = `nodes.${doc.nodes.indexOf(n)}`;
    if (n.when && !present(resolveRef(n.when.$ref, ctx.content))) continue;
    const at = n.at ?? [0, 0];
    const position = { x: at[0], y: at[1] };
    const node = (n.node ?? {}) as Record<string, unknown>;

    switch (n.kind) {
      case "blob": {
        const entry = ctx.registry[n.component!];
        if (!entry) {
          error(ctx, `${path}.component`, `"${n.component}" is not in the registry`);
          break;
        }
        if (!entry.kind.includes("blob")) error(ctx, `${path}.component`, `${n.component} may not be hosted by a blob node (§6 rule 1)`);
        const p = prepare({ component: n.component!, props: n.props }, entry, path, ctx);
        if (p === null) break;
        const a = "element" in p ? {} : p.authored;
        const hue = a.hue === "accent" ? undefined : (str(a.hue) as Hue | undefined);
        const variant = a.variant === "glass" ? "glass" : "character";
        const blob: BlobSceneNode = {
          kind: "blob",
          id: n.id,
          position,
          section: n.section,
          label: str(a.label) ?? "Blob",
          hue,
          variant,
          state: a.state === "sleep" ? "sleep" : "idle",
          say: str(node.say),
          tint: str(node.tint) as Hue | undefined,
          href: str(node.href),
          view: str(node.view),
          below: node.below === true,
        };
        scene.push(blob);
        break;
      }
      case "panel": {
        const r = renderNode(n, path, ctx, "panel");
        if (!r) break;
        const [width, authoredHeight] = n.size!;
        let height = authoredHeight ?? n.measured?.h;
        if (height === undefined) {
          warn(ctx, `${path}.size`, `panel "${n.id}" has no measured height; rendered at one box (§1.3, §6 rule 8)`);
          height = doc.grid.box;
        }
        const panel: PanelSceneNode = {
          kind: "panel",
          id: n.id,
          position,
          section: n.section,
          width,
          height,
          surface: node.surface as PanelSceneNode["surface"],
          scroll: node.scroll === true,
          label: str(node.label) ?? str(r.authored.label) ?? str(r.authored.title),
          content: r.element,
        };
        scene.push(panel);
        break;
      }
      case "widget": {
        const r = renderNode(n, path, ctx, "widget");
        if (!r) break;
        const [width, height] = n.size!;
        const widget: WidgetSceneNode = {
          kind: "widget",
          id: n.id,
          position,
          section: n.section,
          width,
          height: height ?? doc.grid.box * 3,
          view: str(node.view) ?? n.section ?? n.id,
          label: str(node.label) ?? str(r.authored.label) ?? n.id,
          content: r.element,
        };
        scene.push(widget);
        break;
      }
      case "region": {
        const [width, height] = n.size!;
        let label = str(node.label) ?? "";
        if (n.component) {
          const r = renderNode(n, path, ctx, "region");
          label = str(r?.authored.text) ?? label;
        }
        const region: RegionSceneNode = { kind: "region", id: n.id, position, section: n.section, width, height: height ?? doc.grid.box, label };
        scene.push(region);
        break;
      }
      case "menu": {
        const [width, height] = n.size!;
        const menu: MenuSceneNode = {
          kind: "menu",
          id: n.id,
          position,
          section: n.section,
          width,
          height: height ?? doc.grid.box,
          label: str(node.label),
          items: node.items as MenuSceneNode["items"],
        };
        scene.push(menu);
        break;
      }
      case "page": {
        const r = renderNode(n, path, ctx, "page");
        if (!r) break;
        if (r.authored.page !== true) warn(ctx, `${path}.props.page`, `a page node's Bento should say page: true (§9.2)`);
        pages.push({ id: n.id, section: n.section, label: str(node.label) ?? str(r.authored.label), content: r.element });
        break;
      }
    }
  }

  const valid = !ctx.issues.some((i) => i.level === "error");
  return { valid, scene, views: doc.views as CanvasView[], threads: doc.threads, pages, issues: ctx.issues };
}
