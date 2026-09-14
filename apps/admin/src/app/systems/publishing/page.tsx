import { Chip, Placeholder, SectionHeader, Step, Steps, ToolScreen } from "@no-origins/ui";

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
  ["Pointer moved", "documents.current_version_id. The draft is untouched; publishing is not a save."],
  ["Revalidate called", "A webhook on the portfolio for the routes the change touches. Output stays static, so §9's bar holds."],
  ["Live route read back", "The published page states its version in a meta tag. The admin fetches it and compares. Green only when they match."],
] as const;

export default function Publishing() {
  return (
    <ToolScreen eyebrow="Systems" title="Publishing" meta={<Chip hue="grey">nothing published</Chip>}>
      <SectionHeader
        level={3}
        rhythm={false}
        title="ISR plus a webhook revalidate"
        lead="The output stays static, so the live portfolio is never slower, less crawlable or less reliable than it is today. Five steps, and the last one is the one that matters."
      />
      <Steps hue="lavender">
        {STEPS.map(([title, body]) => (
          <Step key={title} title={title}>{body}</Step>
        ))}
      </Steps>
      <Placeholder title="Nothing has been published">
        The pipeline is step 8. Until then the live portfolio renders from source and there is no version for this
        screen to report — which is also the only state in which a publish button that lies has never lied.
      </Placeholder>
    </ToolScreen>
  );
}
