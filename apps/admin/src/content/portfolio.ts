import type { SceneDocument } from "@no-origins/ui/document";
import home from "./portfolio-home.json";
import content from "./portfolio-content.json";

/**
 * The seed draft for `portfolio/home`, and the content its refs resolve against (Scene-Schema.md §3.4).
 *
 * **Both are COPIES, on purpose.** `apps/portfolio/src/content/document.ts` is the portfolio app's, and one app
 * may not import another's source — that is a build-time coupling between two things that deploy separately, and
 * the whole point of R5 is that the live site keeps rendering from `scene.tsx` while the editor works on a draft
 * that nobody sees. The package cannot hold it either: portfolio copy is a project's content, not a design
 * system's (Design-System.md §11.2).
 *
 * They are copies of what `/fixtures/document` renders, taken 2026-09-14, and they matter exactly once: the
 * first time the editor opens a document row with no `draft`. After that the row is truth and these files are
 * history. Regenerate them by re-exporting `portfolioDocument` and `documentContent()` if the fixture moves on
 * before a draft exists.
 *
 * The content is real copy where real copy exists and marked sample copy where it does not — §6.5c F4: a node
 * that resolved a ref into a sampled key wears the sample-copy tag, which is a promise this file has to keep.
 */
export const seedDocument = home as unknown as SceneDocument;

/** The content the document's `$ref`s read. The three derived keys are the host's (§8.1 ⑦), baked in here. */
export const portfolioContent: Record<string, unknown> = content;

/** Every dotted key the content offers, for the inspector's ref picker (Scene-Schema.md §3.4). */
export function contentKeys(value: unknown = portfolioContent, prefix = "", out: string[] = []): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    out.push(path);
    if (v && typeof v === "object" && !Array.isArray(v)) contentKeys(v, path, out);
  }
  return out;
}
