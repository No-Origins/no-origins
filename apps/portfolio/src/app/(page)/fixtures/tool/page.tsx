import type { Metadata } from "next";
import { Button, Chip, Document, Field, Ground, Menu, Placeholder, SectionHeader, Segmented, Select, Table, Tabs, Text, ThemeSwitch, Tool, ToolScreen, Toggle, Tree, type TreeNode } from "@no-origins/ui";
import { entries, layers } from "@no-origins/ui/registry";

export const metadata: Metadata = { title: "Tool template", robots: { index: false } };

/**
 * Step 5's fixture (Atomic.md D6): the `Tool` template as the admin wears it, with every region filled — rail,
 * header, main, inspector, bar — on data that needs no database, so the review sweep can look at the shell the
 * admin's own routes hide behind auth. Below it, the `Document` template with every element markdown produces.
 * Third, the editor's shell (Admin.md §6.5 row 1, 2026-09-14): the Menu in its rail form, a `sidebar` holding the
 * palette (the registry by layer) and the outline (a `Tree`), a `flush` main the canvas will fill, the inspector
 * and the bar. The canvas itself is step 3; the ground with its grid stands in so the flush edges can be seen.
 */
const GROUPS = [
  { items: [{ href: "/fixtures/tool", label: "Overview" }] },
  { label: "Projects", hue: "peach" as const, items: [{ href: "#projects", label: "All projects", items: [{ href: "#portfolio", label: "Portfolio" }] }] },
  {
    label: "Systems", hue: "lavender" as const,
    items: [{ href: "#systems", label: "All systems", items: [{ href: "#design", label: "Design System" }, { href: "#document", label: "Document" }, { href: "#publishing", label: "Publishing" }, { href: "#storage", label: "Storage" }] }],
  },
  { label: "Products", hue: "blue" as const, items: [{ href: "#products", label: "All products", badge: 2 }] },
];

const VERSIONS = [
  { v: 12, label: "Roadmap, honest counts", by: "bhargav", when: "2026-09-14", state: "live" },
  { v: 11, label: "Work ring at 2200", by: "bhargav", when: "2026-09-11", state: "superseded" },
  { v: 10, label: "First publish", by: "bhargav", when: "2026-09-08", state: "superseded" },
];

const OUTLINE: TreeNode[] = [
  { id: "me", label: "Me", children: [{ id: "me-blob", label: "The blob" }, { id: "me-intro", label: "Intro" }] },
  { id: "work", label: "Work", children: [{ id: "work-widget", label: "Widget" }, { id: "work-full", label: "Full view" }] },
  { id: "status", label: "Status", children: [{ id: "status-widget", label: "Widget" }] },
  { id: "menu", label: "Sections menu" },
];

const PALETTE = layers.map((layer) => ({ layer, names: entries.filter((e) => e.layer === layer).map((e) => e.name) }));

export default function ToolFixture() {
  return (
    <>
      <Tool menu={<Menu groups={GROUPS} currentHref="/fixtures/tool" form="column" trailing={<ThemeSwitch />} />}>
        <ToolScreen
          eyebrow="Projects"
          title="Portfolio"
          meta={<><Chip hue="green">live</Chip><Chip hue="peach">bhargav.no-origins.com</Chip><Text size="small" tone="muted" as="span">saved 2 minutes ago</Text></>}
          actions={<><Button variant="secondary" size="sm">Preview</Button><Button size="sm">Publish</Button></>}
          inspector={
            <>
              <SectionHeader level={4} rhythm={false} label="selected" title="BlockCard" lead="Neptune, Hashnode's editor" />
              <Field label="Title" defaultValue="Neptune, Hashnode's editor" />
              <Select label="Hue" defaultValue="blue" options={["peach", "lavender", "blue", "green", "pink", "yellow", "grey"].map((h) => ({ value: h, label: h }))} />
              <Toggle label="Show the blob" />
              <Segmented label="State" options={[{ value: "idle", label: "Idle" }, { value: "sleep", label: "Asleep" }]} />
            </>
          }
          bar={
            <>
              <Segmented label="Viewport" options={[{ value: "desktop", label: "Desktop" }, { value: "phone", label: "Phone" }]} />
              <Segmented label="Grid" options={[{ value: "on", label: "Grid" }, { value: "off", label: "Off" }]} />
              <Text size="small" tone="muted" as="span">zoom 0.9</Text>
              <ThemeSwitch />
            </>
          }
        >
          <Tabs
            label="Project"
            defaultValue="versions"
            tabs={[
              { value: "documents", label: "Documents", panel: <Placeholder title="No documents yet">Under R5 the first document is a blank canvas, composed in the editor.</Placeholder> },
              {
                value: "versions",
                label: "Versions",
                panel: (
                  <Table
                    caption="Published versions"
                    captionHidden
                    rowKey={(r) => String(r.v)}
                    columns={[
                      { key: "v", header: "Version", align: "num", width: "88px" },
                      { key: "label", header: "Label" },
                      { key: "by", header: "By" },
                      { key: "when", header: "Published", align: "num" },
                      { key: "state", header: "State", render: (r) => <Chip hue={r.state === "live" ? "green" : "grey"}>{r.state}</Chip> },
                    ]}
                    rows={VERSIONS}
                  />
                ),
              },
              { value: "settings", label: "Settings", panel: <Placeholder title="Settings">Domain, metadata, hue. Not theme — tokens are a code edit (R3).</Placeholder> },
            ]}
          />
          <SectionHeader level={3} rhythm={false} title="The read-back" lead="Publishing ends at a read-back, not at the webhook: the live route states its version and the admin compares." />
          <Table
            caption="Read-back"
            captionHidden
            density="compact"
            rowKey={(r) => r.route}
            columns={[
              { key: "route", header: "Route", render: (r) => <code>{r.route}</code> },
              { key: "expected", header: "Expected", align: "num" },
              { key: "live", header: "Live", align: "num" },
              { key: "ok", header: "Match", render: (r) => <Chip hue={r.ok ? "green" : "pink"}>{r.ok ? "yes" : "no"}</Chip> },
            ]}
            rows={[{ route: "/", expected: 12, live: 12, ok: true }, { route: "/work", expected: 12, live: 12, ok: true }, { route: "/status", expected: 12, live: 11, ok: false }]}
          />
        </ToolScreen>
      </Tool>

      <Tool menu={<Menu groups={GROUPS.slice(0, 1)} currentHref="/fixtures/tool" form="column" />}>
        <ToolScreen eyebrow="Systems" title="Document" meta={<Chip hue="lavender">the reading column</Chip>}>
          <Document>
            <h2>What a document wears</h2>
            <p>
              The editor block publishes documents. A document is <strong>markdown plus one directive</strong> — a link that
              moves the viewport — and it renders in a 68ch column. This is that column, with every element markdown
              produces, so the renderer can emit plain HTML and get the ramp.
            </p>
            <h3>Lists and code</h3>
            <ul>
              <li>Lists take a marker in <code>--muted</code>, so the text leads.</li>
              <li>Inline code sits on <code>--ground-2</code> at the radius the chips use.</li>
              <li>Links underline in the block accent and go to ink on hover.</li>
            </ul>
            <pre><code>{`const blocks = 7;\nconst hue = "peach";`}</code></pre>
            <blockquote>A blockquote stands on the accent rule at the lead size — someone else&apos;s words, set apart without a glyph pretending to be an image.</blockquote>
            <h4>A table</h4>
            <table>
              <thead><tr><th>Layer</th><th>What</th><th>Count</th></tr></thead>
              <tbody>
                <tr><td>Tokens</td><td>the values</td><td>12 groups</td></tr>
                <tr><td>Atoms</td><td>one thing, one job</td><td>17</td></tr>
                <tr><td>Molecules</td><td>atoms combined</td><td>14</td></tr>
              </tbody>
            </table>
            <hr />
            <p>Then a rule, and the next section.</p>
          </Document>
        </ToolScreen>
      </Tool>

      <style>{`
        .fx-palette { display: flex; flex-direction: column; gap: var(--s-2); }
        .fx-palette__list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--s-1) var(--s-3); color: var(--ink-2); }
        .fx-canvas { display: grid; place-items: center; min-height: 480px; padding: var(--s-8); }
      `}</style>
      <Tool menu={<Menu groups={GROUPS} currentHref="/fixtures/tool" form="rail" />}>
        <ToolScreen
          eyebrow="Projects"
          title="Portfolio"
          meta={<><Chip hue="grey">draft</Chip><Text size="small" tone="muted" as="span">saved 2 minutes ago</Text></>}
          actions={<><Button variant="secondary" size="sm">Preview</Button><Button size="sm">Publish</Button></>}
          flush
          sidebar={
            <>
              <SectionHeader level={4} rhythm={false} label="palette" title="Components" lead="The registry, by layer." />
              {PALETTE.map((g) => (
                <div key={g.layer} className="fx-palette">
                  <p className="noo-label text-muted">{g.layer}s</p>
                  <ul className="fx-palette__list noo-body-sm">
                    {g.names.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                </div>
              ))}
              <SectionHeader level={4} rhythm={false} label="outline" title="Reading order" />
              <Tree label="Outline" nodes={OUTLINE} defaultSelected="work-widget" defaultExpanded={["work"]} />
            </>
          }
          inspector={
            <>
              <SectionHeader level={4} rhythm={false} label="selected" title="Bento widget" lead="Work" />
              <Field label="Eyebrow" defaultValue="WORK EXPERIENCE" />
              <Select label="Hue" defaultValue="peach" options={["peach", "lavender", "blue", "green", "pink", "yellow", "grey"].map((h) => ({ value: h, label: h }))} />
              <Segmented label="Pattern words" options={[{ value: "on", label: "Shown" }, { value: "off", label: "Hidden" }]} />
            </>
          }
          bar={
            <>
              <Segmented label="Viewport" options={[{ value: "desktop", label: "Desktop" }, { value: "phone", label: "Phone" }]} />
              <Segmented label="Grid" options={[{ value: "on", label: "Grid" }, { value: "off", label: "Off" }]} />
              <Text size="small" tone="muted" as="span">zoom 0.9</Text>
              <ThemeSwitch />
            </>
          }
        >
          <Ground className="fx-canvas">
            <Placeholder title="The canvas" draft>
              CanvasShell lands here at step 3. Flush: no gutters, the grid runs to every edge, and the sidebar, the
              inspector and the bar float over it.
            </Placeholder>
          </Ground>
        </ToolScreen>
      </Tool>
    </>
  );
}
