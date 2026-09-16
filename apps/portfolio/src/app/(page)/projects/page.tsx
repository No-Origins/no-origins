import type { Metadata } from "next";
import { Placeholder, Section, SectionHeader } from "@no-origins/ui";

export const metadata: Metadata = { title: "Projects", description: "My own projects. Nothing has shipped yet; this fills as it does." };

/**
 * The one section whose v1 IS the empty state, so it is drawn as the finished thing rather than as scaffolding:
 * no `draft` tag, and words that say what will be here and why it is not (Brand.md principle 4). Filling it with
 * three invented projects would have hidden the only part of it that has to be designed well.
 */
export default function ProjectsPage() {
  return (
    <Section aria-labelledby="projects-title">
      <SectionHeader
        level={1}
        title="Projects"
        titleId="projects-title"
        lead="My own, as they ship. There are none yet, and that is the honest state of it."
      />
      <Placeholder title="Nothing shipped yet">
        Everything I had was deleted for a clean slate. This page fills as things land, starting with the blocks No Origins is made
        of: the editor, then the agents harness. Both are on the roadmap rather than in a drawer.
      </Placeholder>
    </Section>
  );
}
