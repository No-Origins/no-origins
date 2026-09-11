import { Button, Card, Chip, Heading, Placeholder, Row, Section, SectionHeader, Stack, Text } from "@no-origins/ui";
import { entries } from "@no-origins/ui/registry";

export const metadata = { title: "Design System" };

const SHOWCASE = process.env.NEXT_PUBLIC_DESIGN_URL ?? "http://localhost:3001";

/**
 * Systems → Design System (Admin.md §5, R3).
 *
 * **This section writes nothing, and that is the decision rather than a limitation.** R3 makes the package the
 * source of truth for tokens: a change is a code edit, a changeset and a deploy. What that buys is zero drift and
 * an npm consumer who gets the whole look with no database anywhere near it.
 *
 * §13 step 5 folds this screen and `design.no-origins.com` into one build — the catalogue is rendered by the
 * package's own `Catalogue`, so the showcase and the admin cannot disagree about what a component is. Until that
 * step, this screen counts what the registry holds and sends you to the showcase for the live version.
 */
export default function DesignSystem() {
  const drafts = entries.filter((e) => e.status === "draft").length;

  return (
    <Section>
      <SectionHeader
        level={1}
        label="System"
        title="Design System"
        lead="Tokens, primitives, components and blocks — every one of them live, in both themes. Read-only, by decision."
      />

      <Card className="mb-10">
        <Stack gap={8}>
          <Row gap={8}><Chip hue="lavender">R3</Chip><Chip hue="grey">read-only</Chip></Row>
          <Heading level={3}>The package is the source of truth</Heading>
          <Text tone="muted">
            A token change is a code edit, a changeset and a deploy — not a form on this page. The cost is that
            &ldquo;configure the design system from one place&rdquo; became &ldquo;<em>see</em> the design system
            from one place&rdquo;. What it buys is that there is never a second answer to what a colour is.
          </Text>
        </Stack>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card><Stack gap={8}><Heading level={2}>{entries.length}</Heading><Text size="small" tone="muted">components a document may name</Text></Stack></Card>
        <Card><Stack gap={8}><Heading level={2}>{entries.length - drafts}</Heading><Text size="small" tone="muted">settled</Text></Stack></Card>
        <Card><Stack gap={8}><Heading level={2}>{drafts}</Heading><Text size="small" tone="muted">still draft</Text></Stack></Card>
      </div>

      <Placeholder title="The catalogue lands here at step 5" className="mt-12">
        Every component and every token, rendered live in both themes, from the package&apos;s own{" "}
        <code>Catalogue</code> — the same component the showcase uses, so the two cannot drift. Until then it is
        one click away.
        <Row gap={8} className="mt-4">
          <Button as="a" href={SHOWCASE} target="_blank" rel="noreferrer">Open the showcase</Button>
        </Row>
      </Placeholder>
    </Section>
  );
}
