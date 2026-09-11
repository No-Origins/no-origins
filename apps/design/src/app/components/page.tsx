import type { Metadata } from "next";
import { Section, SectionHeader } from "@no-origins/ui";
import { Catalogue } from "@no-origins/ui/registry";

export const metadata: Metadata = { title: "Components" };

export default function Components() {
  return (
    <Section>
      <SectionHeader
        level={1}
        label="the registry"
        title="Every component a document may name"
        lead="Rendered from the registry itself — nothing on this page is written by hand. The editor's palette reads the same array, so adding a component to the package adds it here and there at once."
      />
      <Catalogue />
    </Section>
  );
}
