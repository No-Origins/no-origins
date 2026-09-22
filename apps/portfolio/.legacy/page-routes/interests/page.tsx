import type { Metadata } from "next";
import { Placeholder, Section, SectionHeader, Text } from "@no-origins/ui";
import { SampleTag } from "@/components/sample-tag";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Interests", description: "What I'm curious about outside the work." };

export default function InterestsPage() {
  return (
    <Section aria-labelledby="interests-title">
      <SectionHeader
        level={1}
        title="Interests"
        titleId="interests-title"
        lead="What I'm curious about when nobody is paying me to be. Some of it feeds the work; most of it does not have to."
      />
      {site.interests ? (
        <div className="flex flex-col gap-3">
          <SampleTag of="interests" />
          <ul className="flex max-w-[68ch] flex-col gap-2">
            {site.interests.map((line) => (
              <li key={line}>
                <Text as="span" tone="muted">{line}</Text>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Placeholder draft title="What I'm curious about">
          Outside the work. &ldquo;curious, creative, happy&rdquo; is how Bhargav comes across, which isn&apos;t the same as what
          he&apos;s into.
        </Placeholder>
      )}
    </Section>
  );
}
