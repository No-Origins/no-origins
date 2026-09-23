import type { Metadata } from "next";
import { BlockCard, Button, Section, SectionHeader, Text } from "@no-origins/ui";
import { roles } from "@/content/work";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Work",
  description: "Four roles, told as blocks: editors, design systems, agent systems, and shipping full-stack.",
};

/** The one section that is fully written (Design-System.md §13). Newest first, as `content/work.ts` orders them. */
export default function WorkPage() {
  return (
    <Section aria-labelledby="work-title">
      <SectionHeader
        level={1}
        title="Four roles, told as blocks"
        titleId="work-title"
        lead="Editors, design systems, agent systems, and shipping full-stack."
      />
      <div className="grid items-start gap-5 md:grid-cols-2">
        {roles.map((role) => (
          <BlockCard key={String(role.title)} {...role} />
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        {site.resumeHref ? (
          <Button variant="secondary" href={site.resumeHref} download>Download the résumé</Button>
        ) : null}
        <Text size="small" tone="muted">Chosen pieces of this work are on Case Studies.</Text>
      </div>
    </Section>
  );
}
