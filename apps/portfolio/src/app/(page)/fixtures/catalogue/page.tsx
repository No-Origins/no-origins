import type { Metadata } from "next";
import { Divider, Heading, Label, Row, Stack, Text } from "@no-origins/ui";
import { entries, groups, byGroup, registryHash, type PropSpec } from "@no-origins/ui/registry";

export const metadata: Metadata = { title: "Catalogue fixture", robots: { index: false } };

/**
 * The catalogue, rendered from the registry (Scene-Schema.md §2, §3.2).
 *
 * **This page is the proof that one declaration drives three consumers.** Nothing below is written by hand: every
 * name, line, prop, slot and live sample comes out of `@no-origins/ui/registry`. The public showcase at
 * `design.no-origins.com` and the admin's Design System section (Admin.md §5.1) render the same array, and the
 * editor's palette reads it too — so adding a component to the package adds it to all three at once, and two
 * hand-maintained lists can never drift.
 */

/** A PropSpec as one readable line. The inspector will render controls from the same shape (§3.1). */
function describe(spec: PropSpec): string {
  const base = (() => {
    switch (spec.type) {
      case "enum": return spec.of.join(" | ");
      case "list": return `list of ${describe(spec.of as PropSpec)}${spec.max ? `, max ${spec.max}` : ""}`;
      case "object": return `{ ${Object.keys(spec.fields).join(", ")} }`;
      case "number": return `number${spec.unit ? ` (${spec.unit})` : ""}`;
      case "text": return `text${spec.max ? ` ≤ ${spec.max}` : ""}`;
      case "hue": return spec.accent ? "hue | accent" : "hue";
      default: return spec.type;
    }
  })();
  const bits = [base];
  if (spec.default !== undefined) bits.push(`default ${JSON.stringify(spec.default)}`);
  return bits.join(" · ");
}

export default function CatalogueFixture() {
  const hash = registryHash();
  const newCount = entries.filter((e) => e.status === "draft").length;

  return (
    <div className="noo-container py-14">
      <Label className="text-muted">no origins · admin step 2 · the registry</Label>
      <Heading level={2} className="mt-2">The catalogue</Heading>
      <Text size="lead" className="mt-3 max-w-[64ch] text-ink-2">
        Every component a document may name, rendered from the registry itself. Nothing on this page is written by
        hand — the showcase, the admin&apos;s Design System section and the editor&apos;s palette all read this same
        array, so adding a component to the package adds it to all three.
      </Text>
      <Row gap={16} className="mt-6">
        <Text size="small" tone="muted" as="span">{entries.length} entries</Text>
        <Text size="small" tone="muted" as="span">{newCount} draft</Text>
        <Text size="small" tone="muted" as="span">
          registryHash <span className="noo-code">{hash}</span>
        </Text>
      </Row>
      <Text size="small" tone="muted" className="mt-3 max-w-[64ch]">
        The hash fingerprints names, kinds, prop schemas and slots — and nothing else. It goes on every published
        version, so two publishes with equal hashes are guaranteed to render alike. It is blind to examples and
        defaults, because neither can change how an existing document renders.
      </Text>

      {groups.map((group) => (
        <section key={group} className="mt-16">
          <Heading level={3} className="capitalize">{group}</Heading>
          <Divider className="mt-4" />

          {byGroup(group).map((e) => (
            <article key={e.name} className="mt-10 grid gap-6 md:grid-cols-[240px_1fr]">
              <Stack gap={8} className="min-w-0">
                <Row gap={8} align="baseline">
                  <Heading level={4}>{e.name}</Heading>
                  <span className={e.status === "draft" ? "noo-placeholder__tag" : "noo-label text-muted"}>
                    {e.status}
                  </span>
                </Row>
                <Text size="small" tone="muted">{e.line}</Text>
                <Label className="text-muted">{e.kind.join(" · ")}</Label>

                <div className="mt-2">
                  {Object.entries(e.props).map(([k, spec]) => (
                    <p key={k} className="noo-code text-[12px] leading-[1.9] text-muted">
                      <span className="text-ink-2">{k}</span>
                      {spec.required ? <span className="text-accent-deep">*</span> : null} {describe(spec)}
                    </p>
                  ))}
                  {Object.entries(e.slots ?? {}).map(([k, slot]) => (
                    <p key={k} className="noo-code text-[12px] leading-[1.9] text-muted">
                      <span className="text-ink-2">{k}</span> slot ·{" "}
                      {slot.admits === "blocks" ? "blocks" : slot.admits.join(", ")}
                    </p>
                  ))}
                </div>
              </Stack>

              <div className="min-w-0 overflow-x-auto rounded-lg border border-rule bg-surface p-6">
                {e.example()}
              </div>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
