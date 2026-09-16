import { Card, Label, Row, Stack, Text, hues } from "@no-origins/ui";
import { TokenScreen } from "@/components/token-screen";

export const metadata = { title: "Colour" };

/** The family (Design-System.md §2.2) — three tiers each, and grey standing apart as the host. */
export default function Colour() {
  return (
    <TokenScreen slug="colour">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hues.map((h) => (
          <Card key={h} padding="sm">
            <Stack gap={8}>
              <Row gap={8} align="center">
                <span className="noo-dot" data-hue={h} />
                <Label>{h}</Label>
              </Row>
              <div className="flex overflow-hidden rounded-md">
                <span className="h-12 flex-1" style={{ background: `var(--${h})` }} />
                <span className="h-12 flex-1" style={{ background: `var(--${h}-deep)` }} />
                <span className="h-12 flex-1" style={{ background: `var(--${h}-tint)` }} />
              </div>
              <Text size="small" tone="muted">fill · deep · tint</Text>
            </Stack>
          </Card>
        ))}
      </div>
      <Text size="small" tone="muted" className="max-w-[66ch]">
        A component never names a hue: it reads <code className="noo-code">--hue</code>,{" "}
        <code className="noo-code">--hue-deep</code>, <code className="noo-code">--hue-tint</code> and{" "}
        <code className="noo-code">--hue-ink</code>, and <code className="noo-code">data-hue</code> on any ancestor
        fills them in (D1). An eighth hue is one row in the stylesheet, not twelve ladders through it.
      </Text>
    </TokenScreen>
  );
}
