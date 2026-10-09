import type { Entry, Palette, PaletteColour } from "../engine/types.ts";
import { plain } from "./library/plain.ts";

/** The sample's library (Cinema-Engine.md E5): what `@cinema/content` is wherever his private folder is not. */
export const ENTRIES: Entry[] = [plain];

/** The sample names no colours of its own: its swatches are the ones its entries start from. */
export const PALETTE: PaletteColour[] = [];
export const PALETTES: Palette[] = [];

/** The sample's Assets section (Cinema.md F11): its one made-up environment, so the home page and a bench have one. */
export const ASSETS: string[] = ["plain"];
