import { Chip, Placeholder, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { entries, registryHash } from "@no-origins/ui/registry";

export const metadata = { title: "Document" };

/**
 * Systems → Document (Admin.md §4) — the schema, the registry, and what each component accepts.
 *
 * The fingerprint is the point of this screen existing before anything is authored. Every published version
 * stores the `registry_hash` it was rendered against; when this number changes, a document published under the
 * old one may name a prop that no longer exists. Showing it here means the number is visible before it is a
 * problem.
 */
export default function DocumentSystem() {
  const rows = entries.map((e) => ({
    name: e.name, layer: e.layer, group: e.group, kind: e.kind.join(" · "), props: Object.keys(e.props).length, status: e.status,
  }));
  return (
    <ToolScreen eyebrow="Systems" title="Document" meta={<Chip hue="lavender">fingerprint {registryHash()}</Chip>}>
      <SectionHeader
        level={3}
        rhythm={false}
        title="What a document may say"
        lead="The component registry: every component a document may name, what it is placed as, and how many props it accepts. The fingerprint is FNV-1a over every entry's name, kinds, props and slots — a document published before a component changed can be spotted rather than discovered."
      />
      <Table
        caption="The registry"
        captionHidden
        density="compact"
        stickyHeader
        rowKey={(r) => r.name}
        columns={[
          { key: "name", header: "Component" },
          { key: "layer", header: "Layer", width: "110px" },
          { key: "group", header: "Group", width: "120px" },
          { key: "kind", header: "Placed as" },
          { key: "props", header: "Props", align: "num", width: "80px" },
          { key: "status", header: "Status", render: (r) => <Chip hue={r.status === "stable" ? "green" : r.status === "deprecated" ? "pink" : "grey"}>{r.status}</Chip> },
        ]}
        rows={rows}
      />
      <Placeholder title="The document model">
        Being redesigned. The canvas scene the first draft assumed came out with React Flow in version 1.0 of the
        design system, and nothing is authored in the admin until its replacement is decided — so there is no
        schema to print here yet. The registry above is not waiting on that: it is the source the catalogue is
        built from, and its fingerprint is the number every future publish records.
      </Placeholder>
    </ToolScreen>
  );
}
