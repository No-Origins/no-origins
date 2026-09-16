import { Label, Row, Stack, Text } from "@no-origins/ui";
import { TokenScreen } from "@/components/token-screen";

export const metadata = { title: "Type" };

const SCALE = [
  ["noo-display-1", "Display 1", "Bowlby 72 / 1"],
  ["noo-display-2", "Display 2", "Bowlby 56 / 1"],
  ["noo-h1", "Heading 1", "Bowlby 44 / 1.02"],
  ["noo-h2", "Heading 2", "Bowlby 34 / 1.05"],
  ["noo-h3", "Heading 3", "Hanken 600 · 26 / 1.15"],
  ["noo-h4", "Heading 4", "Hanken 600 · 21 / 1.25"],
  ["noo-lead", "Lead", "Hanken 400 · 19 / 1.5"],
  ["noo-body", "Body", "Hanken 400 · 16 / 1.55"],
  ["noo-body-sm", "Body small", "Hanken 400 · 14.5 / 1.5"],
  ["noo-caption", "Caption", "Hanken 500 · 13 / 1.45"],
  ["noo-label", "Label", "JetBrains 500 · 12 / 0.1em / upper"],
] as const;

export default function Type() {
  return (
    <TokenScreen slug="type">
      <Stack gap={24}>
        {SCALE.map(([cls, name, spec]) => (
          <div key={cls}>
            <Row gap={16} align="baseline" className="mb-1">
              <Label className="text-muted">{name}</Label>
              <Text size="small" tone="muted" as="span">{spec}</Text>
            </Row>
            <p className={cls} style={{ margin: 0 }}>One system, every block</p>
          </div>
        ))}
      </Stack>
      <Text size="small" tone="muted" className="max-w-[66ch]">
        The display sizes step down one row on a phone and h2 never falls below 30 (§5). That rule lives in the
        tokens rather than in a component, so every reader of a step agrees about what it currently measures.
      </Text>
    </TokenScreen>
  );
}
