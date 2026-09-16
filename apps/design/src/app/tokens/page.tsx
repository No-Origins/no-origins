import Link from "next/link";
import { Card, Chip, Heading, Stack, Text, ToolScreen } from "@no-origins/ui";
import { tokenPages } from "@/content/tokens";

export const metadata = { title: "Tokens" };

/**
 * The tokens index (reorganised 2026-09-15).
 *
 * This was one page with seven groups down it, which meant the only way to compare two radii was to remember what
 * the hues looked like eight screens up. Each group is now its own screen; this one is the way in, and the only
 * thing it says itself is the rule that governs all seven.
 */
export default function Tokens() {
  return (
    <ToolScreen
      eyebrow="Tokens"
      title="Every value the system has"
      meta={<Chip hue="grey">{tokenPages.length} screens</Chip>}
    >
      <Text size="lead" tone="muted" className="max-w-[68ch]">
        Read-only by decision: a token belongs to the package, and changing one is a code change, a changeset and a
        deploy. That is what keeps <code className="noo-code">@no-origins/ui</code> able to stand alone.
      </Text>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tokenPages.map((p) => (
          <Card key={p.slug} as={Link} href={`/tokens/${p.slug}`} interactive padding="sm">
            <Stack gap={8}>
              <Heading level={4}>{p.title}</Heading>
              <Text size="small" tone="muted">{p.line}</Text>
            </Stack>
          </Card>
        ))}
      </div>
    </ToolScreen>
  );
}
