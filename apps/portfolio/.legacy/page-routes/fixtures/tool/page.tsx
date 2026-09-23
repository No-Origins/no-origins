import type { Metadata } from "next";
import { Button, Chip, Document, Field, Menu, Placeholder, SectionHeader, Segmented, Select, Table, Tabs, Text, ThemeSwitch, Tool, ToolScreen, Toggle } from "@no-origins/ui";

export const metadata: Metadata = { title: "Tool template", robots: { index: false } };

/**
 * Step 5's fixture (Atomic.md D6): the `Tool` template as the admin wears it, with every region filled — menu,
 * header, main, inspector, bar — on data that needs no database, so the review sweep can look at the shell the
 * admin's own routes hide behind auth. Below it, the `Document` template with every element markdown produces.
 *
 * There used to be a third shell here: the editor, with the Menu in its rail form and a `flush` main for the
 * canvas. The rail, `flush` and the canvas all went in v1 (2026-09-16), and a fixture for a shell that no longer
 * exists is worse than no fixture at all.
 *
 * The menus are `form="auto"`, not `"column"`: below 900 a forced column keeps its 280px and squeezes the screen
 * off the side of a phone, which is exactly what `auto` exists to prevent — it hands the same items to the sheet
 * at the bottom of the viewport instead, and `.noo-tool:has(.noo-menu--sheet)` pads the column for it.
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

export default function ToolFixture() {
  return (
    <>
      <Tool menu={<Menu groups={GROUPS} currentHref="/fixtures/tool" form="auto" trailing={<ThemeSwitch />} />}>
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

      <Tool menu={<Menu groups={GROUPS.slice(0, 1)} currentHref="/fixtures/tool" form="auto" />}>
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
    </>
  );
}
