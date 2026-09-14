import type { Metadata } from "next";
import { Heading, Label, Text } from "@no-origins/ui";
import { Catalogue } from "@no-origins/ui/registry";

export const metadata: Metadata = { title: "Catalogue fixture", robots: { index: false } };

/**
 * The catalogue, during development.
 *
 * The rendering lives in the package (`@no-origins/ui/registry`) because it has two consumers: the public
 * showcase at `design.no-origins.com` and the admin's Design System section (Admin.md §5.1). Copying it into
 * each app would be the same drift the registry exists to prevent — one declaration, and one rendering of it.
 * This page keeps it inside `pnpm review`'s sweep, which the showcase app is not part of.
 */
export default function CatalogueFixture() {
  return (
    <div className="noo-container py-14">
      <Label className="text-muted">no origins · admin step 2 · the registry</Label>
      <Heading level={2} className="mt-2">The catalogue</Heading>
      <Text size="lead" className="mt-3 max-w-[64ch] text-ink-2">
        Every component a document may name, rendered from the registry itself. The same view ships at
        design.no-origins.com and inside the admin.
      </Text>
      <div className="mt-8">
        <Catalogue />
      </div>
    </div>
  );
}
