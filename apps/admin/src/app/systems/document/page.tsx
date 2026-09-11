import { Card, Chip, Heading, Label, Row, Section, SectionHeader, Stack, Text } from "@no-origins/ui";
import { entries, registryHash } from "@no-origins/ui/registry";

export const metadata = { title: "Document" };

/**
 * Systems → Document (Admin.md §4) — the schema, the registry, and what each component accepts.
 *
 * The fingerprint is the point of this screen existing before the editor does. Every published version stores the
 * `registry_hash` it was rendered against; when this number changes, a document published under the old one may
 * name a prop that no longer exists. Showing it here means the number is visible before it is a problem.
 */
export default function DocumentSystem() {
  const groups = [...new Set(entries.map((e) => e.group))].sort();

  return (
    <Section>
      <SectionHeader
        level={1}
        label="System"
        title="Document"
        lead="The scene schema, the component registry, and the one inline directive set prose is allowed. What a document may say, in one place."
      />

      <Card className="mb-10">
        <Stack gap={8}>
          <Label className="text-muted">registry fingerprint</Label>
          <Heading level={3} className="noo-nums">{registryHash()}</Heading>
          <Text size="small" tone="muted">
            FNV-1a over every entry&apos;s name, kinds, props and slots. Each published version records the hash it
            was rendered against, so a document published before a component changed can be spotted rather than
            discovered.
          </Text>
        </Stack>
      </Card>

      <Heading level={3} className="mb-4">{entries.length} components, {groups.length} groups</Heading>
      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => {
          const inGroup = entries.filter((e) => e.group === group);
          return (
            <Card key={group}>
              <Stack gap={8}>
                <Heading level={4}>{group}</Heading>
                <Row gap={8} className="flex-wrap">
                  {inGroup.map((e) => (
                    <Chip key={e.name} hue={e.status === "draft" ? "grey" : "lavender"}>{e.name}</Chip>
                  ))}
                </Row>
              </Stack>
            </Card>
          );
        })}
      </div>

      <Card className="mt-10">
        <Stack gap={8}>
          <Heading level={4}>Directives</Heading>
          <Text size="small" tone="muted">
            R4: prose is markdown plus one declared extension — <code>:pan[Work]{"{view=work}"}</code>, a link that
            moves the viewport instead of loading a document. It is inserted by a control, never typed. The set is
            a registry like everything else and will be listed here once the renderer is built (step 6).
          </Text>
        </Stack>
      </Card>
    </Section>
  );
}
