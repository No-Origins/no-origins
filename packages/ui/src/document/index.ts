/**
 * @no-origins/ui/document — the document layer (Scene-Schema.md; Admin.md §13 step 6, built 2026-09-14).
 *
 * The schema as Zod (§1), the registry's prop schemas as validators (§3), refs (§3.4), markdown with the two
 * directives (§3.5), and the adapter that turns a document into the `SceneNode[]` the canvas already takes (§4).
 * Its own subpath, because it carries the registry and zod, which `@no-origins/ui/canvas` should not: the live
 * portfolio renders a hand-written scene and needs neither.
 */
export { documentToScene } from "./adapter";
export type { DocumentContext, DocumentPage, Issue, SceneFromDocument } from "./adapter";
export { documentSchema, documentNodeSchema, viewSchema, threadSchema, familySchema, refSchema, nodeData, nodeKinds, slotChildSchema } from "./schema";
export type { SceneDocument, ParsedDocument, DocumentNode, ParsedDocumentNode, DocumentNodeKind, DocumentView, DocumentThread, DocumentFamily, SlotChild, Ref } from "./schema";
export { propType, propsSchema, schemaFor } from "./props";
export type { PropContext } from "./props";
export { isRef, resolveRef, resolveDeep, present } from "./refs";
export type { Unresolved } from "./refs";
export { markdown, inline } from "./markdown";
export type { MarkdownContext, Rendered } from "./markdown";
export { PanLink } from "./PanLink";
export type { PanLinkProps } from "./PanLink";
