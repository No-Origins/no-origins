import type { Metadata } from "next";
import { Card, Placeholder, Section, SectionHeader, Text } from "@no-origins/ui";
import { SampleTag } from "@/components/sample-tag";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Case studies", description: "Chosen pieces of the work, told as problem, approach and outcome." };

/** Problem, then what he did, then what changed. Three labelled parts, because that is what a case study is. */
function CaseStudy({ study }: { study: NonNullable<typeof site.caseStudies>[number] }) {
  const part = (label: string, body: string) => (
    <div className="flex flex-col gap-0.5">
      <p className="noo-label text-muted">{label}</p>
      <Text size="small" tone="muted">{body}</Text>
    </div>
  );
  return (
    <Card padding="sm" className="h-full">
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="noo-h4 text-ink">{study.title}</p>
          <SampleTag of="caseStudies" />
        </div>
        {part("the problem", study.problem)}
        {part("what I did", study.approach)}
        {part("what changed", study.outcome)}
      </div>
    </Card>
  );
}

export default function CaseStudiesPage() {
  return (
    <Section aria-labelledby="cases-title">
      <SectionHeader
        level={1}
        title="Case studies"
        titleId="cases-title"
        lead="Three pieces of the work above, told properly: the problem, what I did, and what changed."
      />
      {site.caseStudies ? (
        <div className="grid items-start gap-5 md:grid-cols-2">
          {site.caseStudies.map((study) => (
            <CaseStudy key={study.title} study={study} />
          ))}
        </div>
      ) : (
        <Placeholder draft title="Three worth telling properly">
          Neptune, Project Vault and GenIQ are already named under Work Experience. Each needs its problem, what Bhargav did, and
          what changed — the bullets there don&apos;t carry that.
        </Placeholder>
      )}
    </Section>
  );
}
