import { z } from "zod";
import { hues } from "../tokens/tokens";

/**
 * The document (Scene-Schema.md §1), as Zod — one schema, and the TypeScript types are read off it so the two cannot
 * disagree. This validates the SHAPE of a document: node kinds, coordinates, the node data each kind defines, the
 * views, the threads, the order. What a node's `props` may say is the registry's business (`props.ts`), because that
 * changes with every component and this does not.
 */

export const refSchema = z.strictObject({ $ref: z.string().min(1) });
export type Ref = z.infer<typeof refSchema>;

const int = z.number().int();
const hue = z.enum(hues);

export const nodeKinds = ["blob", "panel", "widget", "region", "page", "menu"] as const;
export type DocumentNodeKind = (typeof nodeKinds)[number];

/** A pattern the document made in the studio (Admin.md §6.5b): the generator's parameters; `words` only ever written back. */
export const familySchema = z.strictObject({
  seed: z.number(),
  flow: z.number(),
  scale: z.number(),
  swing: z.number(),
  breath: z.number(),
  waves: z.number().optional(),
  drift: z.number().optional(),
  spread: z.number().optional(),
  taper: z.number().optional(),
  curl: z.number().optional(),
  tempo: z.number().optional(),
  pinch: z.number().optional(),
  interrupt: z.boolean().optional(),
  words: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])).optional(),
  res: z.number().optional(),
});

/** Node data, by kind (§1.5) — read by the node renderers, never handed to a component. */
export const nodeData = {
  blob: z.strictObject({
    say: z.string().optional(),
    href: z.string().optional(),
    view: z.string().optional(),
    tint: hue.optional(),
    below: z.boolean().optional(),
  }),
  panel: z.strictObject({
    surface: z.enum(["glass", "solid", "none"]).optional(),
    scroll: z.boolean().optional(),
    label: z.string().optional(),
  }),
  widget: z.strictObject({ view: z.string(), label: z.string().optional() }),
  region: z.strictObject({ label: z.string() }),
  page: z.strictObject({ label: z.string().optional() }),
  menu: z.strictObject({
    label: z.string().optional(),
    items: z.array(z.strictObject({ label: z.string(), view: z.string().optional(), href: z.string().optional() })).min(1),
  }),
} as const;

const propsValue = z.union([z.record(z.string(), z.unknown()), refSchema]);

/** A component inside another component's slot: no coordinates, no node data. */
export interface SlotChild {
  id?: string;
  component: string;
  when?: Ref;
  props?: Record<string, unknown> | Ref;
  slots?: Record<string, SlotChild[]>;
}
export const slotChildSchema: z.ZodType<SlotChild> = z.lazy(() =>
  z.strictObject({
    id: z.string().optional(),
    component: z.string().min(1),
    when: refSchema.optional(),
    props: propsValue.optional(),
    slots: z.record(z.string(), z.array(slotChildSchema)).optional(),
  }),
);

/** The kinds that place a registry component; `region` and `menu` are drawn by their node renderers (Admin.md §6.5). */
const HOSTS_A_COMPONENT: readonly DocumentNodeKind[] = ["blob", "panel", "widget", "page"];
const IN_CANVAS_SPACE: readonly DocumentNodeKind[] = ["blob", "panel", "widget", "region", "menu"];
const HAS_A_SIZE: readonly DocumentNodeKind[] = ["panel", "widget", "region", "menu"];

export const documentNodeSchema = z
  .strictObject({
    id: z.string().min(1),
    kind: z.enum(nodeKinds),
    /** Canvas units, integers (§1.1). Not on a page node (§6 rule 6). */
    at: z.tuple([int, int]).optional(),
    /** Width and height in canvas units; a panel's height may be `null` and measured instead (§1.3). */
    size: z.tuple([int.positive(), int.positive().nullable()]).optional(),
    measured: z.strictObject({ h: z.number().nonnegative(), at: z.string().optional(), slack: z.number().optional() }).optional(),
    section: z.string().optional(),
    when: refSchema.optional(),
    node: z.record(z.string(), z.unknown()).optional(),
    component: z.string().min(1).optional(),
    props: propsValue.optional(),
    slots: z.record(z.string(), z.array(slotChildSchema)).optional(),
  })
  .superRefine((n, ctx) => {
    const need = (ok: boolean, path: string, message: string) => {
      if (!ok) ctx.addIssue({ code: "custom", path: [path], message });
    };
    need(!HOSTS_A_COMPONENT.includes(n.kind) || Boolean(n.component), "component", `a ${n.kind} names a registry component`);
    need(HOSTS_A_COMPONENT.includes(n.kind) || n.kind === "region" || !n.component, "component", `a ${n.kind} is drawn by its node renderer and names no component`);
    need(!IN_CANVAS_SPACE.includes(n.kind) || Boolean(n.at), "at", `a ${n.kind} has a position in canvas units`);
    need(n.kind !== "page" || (!n.at && !n.size), "at", "a page is not in canvas space: no `at`, no `size` (§6 rule 6)");
    need(!HAS_A_SIZE.includes(n.kind) || Boolean(n.size), "size", `a ${n.kind} has a size`);
    need(n.kind !== "blob" || !n.size, "size", "a blob's size is the blob's own");
    if (n.kind !== "panel" && n.size && n.size[1] === null) ctx.addIssue({ code: "custom", path: ["size"], message: "only a panel's height is measured (§1.3)" });
    const data = nodeData[n.kind].safeParse(n.node ?? {});
    if (!data.success) for (const i of data.error.issues) ctx.addIssue({ code: "custom", path: ["node", ...i.path.map(String)], message: i.message });
  });

export const viewSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  nodeIds: z.array(z.string()).min(1),
  frame: z.enum(["fit", "top"]).optional(),
  href: z.string().optional(),
});

export const threadSchema = z.strictObject({ from: z.string(), to: z.string() });

export const documentSchema = z.strictObject({
  schema: z.literal(1),
  id: z.string().min(1),
  kind: z.enum(["canvas", "page"]),
  grid: z.strictObject({ box: int.positive(), pad: int.nonnegative() }).default({ box: 160, pad: 8 }),
  meta: z.strictObject({ title: z.string().optional(), description: z.string().optional() }).optional(),
  patterns: z.record(z.string().min(1), familySchema).default({}),
  nodes: z.array(documentNodeSchema),
  views: z.array(viewSchema).default([]),
  threads: z.array(threadSchema).default([]),
  order: z.array(z.string()).default([]),
});

/** What the editor writes and the adapter reads. `z.input` is the authored shape — defaulted fields may be left out. */
export type SceneDocument = z.input<typeof documentSchema>;
export type ParsedDocument = z.output<typeof documentSchema>;
export type DocumentNode = z.input<typeof documentNodeSchema>;
export type ParsedDocumentNode = z.output<typeof documentNodeSchema>;
export type DocumentView = z.infer<typeof viewSchema>;
export type DocumentThread = z.infer<typeof threadSchema>;
export type DocumentFamily = z.infer<typeof familySchema>;
