import type { Metadata } from "next";
import { Card, Divider, Heading, Label, Row, Section, SectionHeader, Stack, Text, hues } from "@no-origins/ui";
import { ContrastReport } from "@/components/contrast";

export const metadata: Metadata = { title: "Tokens" };

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

const SPACE = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];
const RADIUS = ["xs", "sm", "md", "lg", "xl", "pill"] as const;
const ELEVATION = ["e1", "e2", "e3", "e4"] as const;
const MOTION = [
  ["--d-fast", "140ms", "state on a control"],
  ["--d-base", "220ms", "most transitions"],
  ["--d-slow", "380ms", "a viewport move"],
  ["--d-ambient", "6000ms", "breathe"],
] as const;

function Group({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <Heading level={3}>{title}</Heading>
      {lead ? <Text tone="muted" className="mt-2 max-w-[66ch]">{lead}</Text> : null}
      <Divider className="mt-4" />
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function Tokens() {
  return (
    <Section>
      <SectionHeader
        level={1}
        label="tokens"
        title="Every value the system has"
        lead="Read-only by decision: a token belongs to the package, and changing one is a code change, a changeset and a deploy. That is what keeps @no-origins/ui able to stand alone."
      />

      <Group
        title="The family"
        lead="Seven hues. Each has a pastel fill, a deep tier that works as text on the ground, and a tint for glass. Grey is the host and has no tint of its own."
      >
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
      </Group>

      <Group
        title="Contrast"
        lead="The floors from §12, measured in the theme you are looking at. The showcase cannot refuse a value that breaks one — tokens are code — so its job is to make a broken floor impossible to miss."
      >
        <ContrastReport />
      </Group>

      <Group title="Type" lead="The Bowlby rule: the display face appears at h2 and above, and in the wordmark. Everything smaller is Hanken 600 or 400.">
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
      </Group>

      <Group title="Space" lead="A 4px base. Section rhythm is 96 desktop, 64 mobile; card padding 20–24.">
        <Row gap={16} align="end">
          {SPACE.map((s) => (
            <Stack key={s} gap={8} align="center">
              <span style={{ width: s, height: s, background: "var(--accent-deep)", borderRadius: 2 }} />
              <span className="noo-label text-muted">{s}</span>
            </Stack>
          ))}
        </Row>
      </Group>

      <Group title="Radius" lead="Round is the brand.">
        <Row gap={16}>
          {RADIUS.map((r) => (
            <Stack key={r} gap={8} align="center">
              <span className="h-16 w-16 bg-surface shadow-e1" style={{ borderRadius: `var(--r-${r})` }} />
              <span className="noo-label text-muted">{r}</span>
            </Stack>
          ))}
        </Row>
      </Group>

      <Group title="Elevation" lead="Warm shadows, never grey: all four are built on --shade, which is warm ink in the light theme and black in the dark one.">
        <Row gap={24}>
          {ELEVATION.map((e) => (
            <Stack key={e} gap={8} align="center">
              <span className="h-16 w-24 rounded-lg bg-surface" style={{ boxShadow: `var(--${e})` }} />
              <span className="noo-label text-muted">{e}</span>
            </Stack>
          ))}
        </Row>
      </Group>

      <Group title="Motion" lead="Every duration sits behind a reduced-motion block; nothing ambient survives it.">
        <Stack gap={8}>
          {MOTION.map(([token, value, use]) => (
            <Row key={token} gap={16} align="baseline">
              <span className="noo-code text-ink-2 w-[130px]">{token}</span>
              <span className="noo-code text-muted w-[80px]">{value}</span>
              <Text size="small" tone="muted" as="span">{use}</Text>
            </Row>
          ))}
        </Stack>
      </Group>
    </Section>
  );
}
