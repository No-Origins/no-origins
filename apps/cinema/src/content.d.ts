/**
 * `@cinema/content`, the library entries the app is built with (Cinema-Engine.md E5): his private `src/content` on his
 * machine, the made-up `src/sample` anywhere else, chosen by the bundler's alias in `next.config.ts`. Both export the
 * same thing, and each checks its own against the types where it is written.
 */
declare module "@cinema/content" {
  export const ENTRIES: import("@/engine/types").Entry[];
  export const PALETTE: import("@/engine/types").PaletteColour[];
  export const PALETTES: import("@/engine/types").Palette[];
  /** The Assets section (Cinema.md F11): the library entries that are his assets, in his order, by id. */
  export const ASSETS: string[];
}
