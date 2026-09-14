import { Button, Chip, SectionHeader, Table, Tabs, Text, ToolScreen } from "@no-origins/ui";
import { Catalogue, ContrastReport, byLayer, entries, layers, registryHash } from "@no-origins/ui/registry";

export const metadata = { title: "Design System" };

const SHOWCASE = process.env.NEXT_PUBLIC_DESIGN_URL ?? "http://localhost:3001";

/**
 * Systems → Design System (Admin.md §5, R3).
 *
 * **This section writes nothing, and that is the decision rather than a limitation.** R3 makes the package the
 * source of truth for tokens: a change is a code edit, a changeset and a deploy. What that buys is zero drift and
 * an npm consumer who gets the whole look with no database anywhere near it.
 *
 * §13 step 5, done: the catalogue and the contrast report are the package's own `Catalogue` and `ContrastReport`,
 * the same components the showcase renders, so the two cannot disagree about what a component is or what a colour
 * measures.
 */
export default function DesignSystem() {
  const drafts = entries.filter((e) => e.status === "draft").length;
  const byLayerRows = layers.map((layer) => {
    const es = byLayer(layer);
    return { layer, count: es.length, drafts: es.filter((e) => e.status === "draft").length, names: es.map((e) => e.name).join(", ") };
  });

  return (
    <ToolScreen
      eyebrow="Systems"
      title="Design System"
      meta={
        <>
          <Chip hue="lavender">R3 · read-only</Chip>
          <Chip hue="grey">{entries.length} entries · {drafts} draft</Chip>
        </>
      }
      actions={<Button as="a" variant="secondary" size="sm" href={SHOWCASE} target="_blank" rel="noreferrer">Open the showcase</Button>}
    >
      <Tabs
        label="Design system"
        tabs={[
          {
            value: "registry",
            label: "Registry",
            panel: (
              <>
                <SectionHeader
                  level={3}
                  rhythm={false}
                  title="The package is the source of truth"
                  lead="A token change is a code edit, a changeset and a deploy — not a form on this page. What it buys is that there is never a second answer to what a colour is."
                />
                <Table
                  caption="Entries by layer"
                  captionHidden
                  rowKey={(r) => r.layer}
                  columns={[
                    { key: "layer", header: "Layer", width: "120px" },
                    { key: "count", header: "Entries", align: "num", width: "88px" },
                    { key: "drafts", header: "Draft", align: "num", width: "88px" },
                    { key: "names", header: "Components" },
                  ]}
                  rows={byLayerRows}
                />
                <Text size="small" tone="muted">
                  Registry fingerprint <code>{registryHash()}</code> — every published version records the hash it was rendered against.
                </Text>
              </>
            ),
          },
          { value: "components", label: "Components", panel: <Catalogue summary={false} /> },
          { value: "contrast", label: "Contrast", panel: <ContrastReport /> },
        ]}
      />
    </ToolScreen>
  );
}
