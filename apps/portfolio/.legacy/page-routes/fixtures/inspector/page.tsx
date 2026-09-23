import type { Metadata } from "next";
import { Heading, Label, Text } from "@no-origins/ui";
import { InspectorFixture } from "./inspector";

export const metadata: Metadata = { title: "Inspector controls fixture", robots: { index: false } };

/**
 * The inspector controls decided on 2026-09-14 (Admin.md §6.5a–b), wired and at the inspector's real width, so the
 * review sweep can look at them before the editor exists: HueSwatch (E1 A), PatternPicker with the eighteen
 * patterns and the studio (E2 A + notes), Repeater in both densities (E3 A + C), Tree reordering (E4 A), Range.
 */
export default function InspectorPage() {
  return (
    <div className="noo-container py-14">
      <style>{`
        .fx-insp { display: flex; flex-wrap: wrap; gap: var(--s-10); align-items: flex-start; margin-top: var(--s-8); }
        .fx-insp__col { display: flex; flex-direction: column; gap: var(--s-5); width: 320px; max-width: 100%; padding: var(--s-5); border-radius: var(--r-xl); background: var(--surface); box-shadow: var(--e1); }
        .fx-insp__row { display: flex; flex-direction: column; gap: 6px; }
      `}</style>
      <Label className="text-muted">no origins · the editor · fixture</Label>
      <Heading level={2} className="mt-2">Inspector controls</Heading>
      <Text size="lead" className="mt-3 max-w-[64ch] text-ink-2">
        The three controls the schema needed and the package lacked, plus the outline&apos;s reordering — built to the picks
        of 2026-09-14. Everything here is what a `hue`, `pattern`, `list` or `enum` prop will render in the editor.
      </Text>
      <InspectorFixture />
    </div>
  );
}
