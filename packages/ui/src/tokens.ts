/** The seven family hues (Design-System.md §2.2). Grey has no tint: it is the host, and the host is clear glass. */
export const hues = ["pink", "green", "grey", "lavender", "peach", "yellow", "blue"] as const;
export type Hue = (typeof hues)[number];

/** Blocks and the hue each one owns. */
export const blocks = {
  portfolio: "peach",
  editor: "lavender",
  agents: "blue",
  tools: "yellow",
  writing: "green",
  next: "pink",
} as const satisfies Record<string, Hue>;
export type Block = keyof typeof blocks;

/** Blob widths (Design-System.md §4.2); height is always 2/3. `inline` sizes with the text. Lives here, outside the
 *  "use client" boundary, so a server component can read it — a client module's non-component exports arrive as references. */
export const blobSizes = { favicon: 30, inline: "1.5em", nav: 36, sm: 48, md: 72, lg: 96, hero: 168 } as const;
export type BlobSize = keyof typeof blobSizes;
