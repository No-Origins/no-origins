/**
 * @no-origins/ui/editor — the editor's chrome (Admin.md §6, §6.5c).
 *
 * The palette, the props form, the save indicator and the canvas overlays. Everything visual in the admin lives
 * here rather than in `apps/admin`, because §10 says an admin-only component is a fork of the design system
 * wearing a different folder name.
 *
 * **Nothing here is registered.** A document may only name components the registry exports (Scene-Schema.md §2),
 * and none of this is authorable: a palette that could be dropped onto a canvas is a palette inside a document.
 *
 * Its own subpath, because it carries the registry, the document layer and `@xyflow/react` — three things the
 * live portfolio's `@no-origins/ui` import should never pull in.
 */
export { PropsForm } from "./PropsForm";
export type { PropsFormProps } from "./PropsForm";
export { DocumentForm } from "./DocumentForm";
export type { DocumentFormProps } from "./DocumentForm";
export { Palette, PALETTE_MIME } from "./Palette";
export type { PaletteProps } from "./Palette";
export { SaveState } from "./SaveState";
export type { SaveStateProps, SaveStatus } from "./SaveState";
export { CanvasOverlay, TAG_MIN_ZOOM } from "./Overlay";
export type { CanvasOverlayProps, OverlayBox, Ghost } from "./Overlay";
export { MIXED, freshValue, freshProps, intersection, sharedValue, fieldLabel, blobSizeNames } from "./values";
export type { Selected, Value } from "./values";
