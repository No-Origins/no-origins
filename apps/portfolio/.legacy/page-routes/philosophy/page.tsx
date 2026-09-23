import type { Metadata } from "next";
import { Document, Placeholder, Section, SectionHeader } from "@no-origins/ui";
import { SampleTag } from "@/components/sample-tag";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Philosophy", description: "How I think about building things." };

export default function PhilosophyPage() {
  return (
    <Section aria-labelledby="philosophy-title">
      <SectionHeader
        level={1}
        title="Philosophy"
        titleId="philosophy-title"
        lead="How I think about building things. Mine, not the platform's."
      />
      {site.philosophy ? (
        <div className="flex flex-col gap-3">
          <SampleTag of="philosophy" />
          <Document>
            {site.philosophy.map((para) => <p key={para.slice(0, 24)}>{para}</p>)}
          </Document>
        </div>
      ) : (
        <Placeholder draft title="How I think about building">
          No Origins has five principles, but those belong to the platform. This one is Bhargav&apos;s own, in his words.
        </Placeholder>
      )}
    </Section>
  );
}
