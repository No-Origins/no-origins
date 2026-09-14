"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Chip, Container, SectionHeader, Table, Text, ThemeSwitch } from "@no-origins/ui";
import { CanvasShell, type SceneNode } from "@no-origins/ui/canvas";
import { documentToScene } from "@no-origins/ui/document";
import { registry } from "@no-origins/ui/registry";
import { portfolioDocument } from "@/content/document";
import { site } from "@/content/site";
import { roles } from "@/content/work";
import { CanvasChat } from "./portfolio-canvas";
import { HOST_CANT_CHAT, HOST_SAYS } from "./scene";

/**
 * The portfolio rendered from its DOCUMENT (Scene-Schema.md §4) rather than from `scene.tsx`: the same shell, the
 * same views and threads, the scene produced by the adapter. What differs between this and `/` is a finding, and
 * the list under the canvas says what the adapter found in the document itself.
 *
 * The content the refs resolve against is composed here (§3.4: content lives beside the document). Three keys are
 * derived — a "Based in …" line, the first four interests as a markdown list, the first philosophy paragraph —
 * because §8.1 ⑦ deferred interpolation inside markdown and the host is where a derived line belongs until a
 * second case asks for the feature.
 */
export function documentContent() {
  return {
    site: {
      ...site,
      locationLine: site.location ? `Based in ${site.location}` : undefined,
      interestsMarkdown: site.interests ? site.interests.slice(0, 4).map((l) => `- ${l}`).join("\n") : undefined,
      philosophyFirst: site.philosophy?.[0]?.replace(/^Sample copy\. /, ""),
    },
    work: { roles },
  };
}

export function DocumentCanvas({ initialView = "me", heading = "Bhargav — No Origins, as a document" }: { initialView?: string; heading?: string }) {
  const [hostSays, setHostSays] = useState<string>(HOST_SAYS);
  const router = useRouter();
  const result = useMemo(() => documentToScene(portfolioDocument, registry, { content: documentContent() }), []);
  // `node.say` is a default the host may override (§1.5): the guided chat changes what the blob says.
  const scene = useMemo<SceneNode[]>(() => result.scene.map((n) => (n.kind === "blob" && n.id === "me-blob" ? { ...n, say: hostSays } : n)), [result, hostSays]);

  const onViewChange = useCallback(
    (id: string) => {
      const href = result.views.find((v) => v.id === id)?.href;
      if (href && window.location.pathname !== href) window.history.replaceState(null, "", href);
    },
    [result],
  );

  return (
    <>
      <CanvasShell
        scene={scene}
        views={result.views}
        initialView={initialView}
        onViewChange={onViewChange}
        threads={result.threads}
        onOpen={(href) => router.push(href)}
        heading={heading}
        trailing={<ThemeSwitch />}
        chat={<CanvasChat onMiss={() => setHostSays(HOST_CANT_CHAT)} />}
      />
      {/* the six widgets at 1:1, as /fixtures/bento shows the hand-written ones — the like-for-like the comparison spec reads */}
      <Container className="py-14">
        <SectionHeader level={2} rhythm={false} label="the widgets, at 1:1" title="Six sections, from a document" lead="The same six widgets /fixtures/bento draws from content/sections.tsx, here composed from the document's nodes. Compared element for element by e2e/document.spec.ts." />
        <div className="noo-ground flex flex-col gap-14 rounded-lg" style={{ padding: "var(--grid-box)" }} data-widgets>
          {scene.map((n) => (n.kind === "widget" ? <div key={n.id} style={{ width: n.width, height: n.height }}>{n.content}</div> : null))}
        </div>
      </Container>
      <Container className="py-14" data-document-issues={result.issues.length}>
        <SectionHeader
          level={2}
          rhythm={false}
          label="the adapter's report"
          title={result.valid ? "The document is valid" : "The document is not valid"}
          lead={`${result.scene.length} nodes on the canvas, ${result.pages.length} pages, ${result.issues.length} issues. Compare this map with / — every difference is a finding about the schema or the registry.`}
        />
        {result.issues.length ? (
          <Table
            caption="Issues"
            captionHidden
            density="compact"
            rowKey={(r) => `${r.path}:${r.message}`}
            columns={[
              { key: "level", header: "Level", width: "88px", render: (r) => <Chip hue={r.level === "error" ? "pink" : "yellow"}>{String(r.level)}</Chip> },
              { key: "path", header: "Where", render: (r) => <code>{String(r.path)}</code> },
              { key: "message", header: "What" },
            ]}
            rows={result.issues.map((i) => ({ level: i.level, path: i.path, message: i.message }))}
          />
        ) : (
          <Text size="small" tone="muted">
            No issues: every node named a registered component, every prop passed its schema, every ref resolved, every widget landed on a box corner.
          </Text>
        )}
      </Container>
    </>
  );
}
