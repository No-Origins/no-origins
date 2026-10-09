import type { PageContent } from "@/content";
import type { DocEntry } from "@/content/sitemap";

import { cursorPage } from "./cursor";
import { spacingPage } from "./spacing";

/**
 * The sitemap's pages that are written, by their address. A page not here shows its purpose until it is written; to
 * write one, add its content beside this file and its address here.
 */
export const WRITTEN: Record<string, (entry: DocEntry) => PageContent> = {
  "/foundations/cursor": cursorPage,
  "/tokens/spacing": spacingPage,
};
