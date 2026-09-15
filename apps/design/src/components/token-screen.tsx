import type { ReactNode } from "react";
import { Text, ToolScreen } from "@no-origins/ui";
import { tokenPage } from "@/content/tokens";

/**
 * The frame every token screen wears: the "Tokens" eyebrow and the title and lead from `tokenPages`.
 *
 * Seven screens that each rebuilt this header would be seven places for it to drift, and the lead would stop
 * matching the card on `/tokens` that sends you here. The lead is a plain `Text`, not a `SectionHeader` — the
 * `ToolScreen` header above it has already said the title, and saying it twice is what a screen header is for
 * avoiding.
 */
export function TokenScreen({ slug, meta, children }: { slug: string; meta?: ReactNode; children: ReactNode }) {
  const page = tokenPage(slug);
  return (
    <ToolScreen eyebrow="Tokens" title={page.title} meta={meta}>
      <Text size="lead" tone="muted" className="max-w-[68ch]">{page.line}</Text>
      {children}
    </ToolScreen>
  );
}
