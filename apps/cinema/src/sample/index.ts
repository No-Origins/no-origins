import type { Entry, PaletteColour } from "../engine/types.ts";
import { plain } from "./library/plain.ts";

/** The sample's library (Cinema-Engine.md E5): what `@cinema/content` is wherever his private folder is not. */
export const ENTRIES: Entry[] = [plain];

/** The sample names no colours of its own: its swatches are the ones its entries start from. */
export const PALETTE: PaletteColour[] = [];
