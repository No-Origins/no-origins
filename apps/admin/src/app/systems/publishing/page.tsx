import { Card, Heading, Label, Placeholder, Section, SectionHeader, Stack, Text } from "@no-origins/ui";

export const metadata = { title: "Publishing" };

/**
 * Systems → Publishing (Admin.md §9, R2).
 *
 * The screen states the failure case before the feature exists, because under R2 the failure case is the feature.
 * A dropped revalidate raises no error — the version row is written, the pointer has moved, and the site quietly
 * keeps serving the old one. So publishing does not end at the webhook; it ends at a read-back.
 */
const STEPS = [
  ["Probes pass", "The same checks the editor runs on save. A document that fails one is not publishable."],
  ["Version row written", "An integer and a required label (R1). The label may not be empty and may not repeat — a check constraint and a unique index, not editor manners."],
  ["Pointer moved", "`documents.current_version_id`. The draft is untouched; publishing is not a save."],
  ["Revalidate called", "A webhook on the portfolio for the routes the change touches. Output stays static, so §9's bar holds."],
  ["Live route read back", "The published page states its version in a `<meta name=\"x-noo-version\">`. The admin fetches it and compares. Green only when they match."],
];

export default function Publishing() {
  return (
    <Section>
      <SectionHeader
        level={1}
        label="System"
        title="Publishing"
        lead="ISR plus a webhook revalidate. The output stays static, so the live portfolio is never slower, less crawlable or less reliable than it is today."
      />

      <Stack gap={16}>
        {STEPS.map(([title, body], i) => (
          <Card key={title}>
            <Stack gap={8}>
              <Label className="text-muted">{String(i + 1).padStart(2, "0")}</Label>
              <Heading level={4}>{title}</Heading>
              <Text size="small" tone="muted">{body}</Text>
            </Stack>
          </Card>
        ))}
      </Stack>

      <Placeholder title="Nothing has been published" className="mt-12">
        The pipeline is step 8. Until then the live portfolio renders from source and there is no version for this
        screen to report — which is also the only state in which a publish button that lies has never lied.
      </Placeholder>
    </Section>
  );
}
