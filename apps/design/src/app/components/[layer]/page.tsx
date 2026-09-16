import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chip, Text, ToolScreen } from "@no-origins/ui";
import { Catalogue, byLayer, groups, layerBySlug, layerNotes, layers } from "@no-origins/ui/registry";

/**
 * One Atomic layer, one screen (Design-System.md §14 step 14, reorganised 2026-09-15).
 *
 * `/components` was the whole registry on one page: three layers, nine groups inside each, forty-eight live
 * examples, and a scroll long enough that finding `Chip` meant using the browser's own find. The split is by
 * **layer**, not by group, because the layer is what a component IS — the reading order is the build order, and a
 * molecule read before the atoms it is made of explains nothing (Atomic.md §1).
 *
 * **A dynamic route over three hand-written pages**: the layers are `layers` in the registry, and a fourth one
 * added there should add its screen rather than wait for someone to remember. `generateStaticParams` still makes
 * these three files at build time; `layerBySlug` 404s anything else rather than rendering an empty catalogue.
 *
 * The rendering is the package's own `Catalogue` in its `layer` form — the same component the admin's Design
 * System section renders whole (Admin.md §5.1). Copying it here to filter three ways would be exactly the drift
 * the registry exists to prevent.
 */
export function generateStaticParams() {
  return layers.map((l) => ({ layer: layerNotes[l].slug }));
}

export async function generateMetadata({ params }: PageProps<"/components/[layer]">): Promise<Metadata> {
  const layer = layerBySlug((await params).layer);
  return { title: layer ? layerNotes[layer].title : "Components" };
}

export default async function LayerScreen({ params }: PageProps<"/components/[layer]">) {
  const layer = layerBySlug((await params).layer);
  if (!layer) notFound();

  const inLayer = byLayer(layer);
  const drafts = inLayer.filter((e) => e.status === "draft").length;
  const present = groups.filter((g) => inLayer.some((e) => e.group === g));

  return (
    <ToolScreen
      eyebrow="Components"
      title={layerNotes[layer].title}
      meta={
        <>
          <Chip hue="yellow">{inLayer.length} {inLayer.length === 1 ? "entry" : "entries"}</Chip>
          {drafts ? <Chip hue="pink">{drafts} draft</Chip> : null}
          <Chip hue="grey">layer {layers.indexOf(layer) + 2} of 6</Chip>
        </>
      }
    >
      <Text size="lead" tone="muted" className="max-w-[68ch]">{layerNotes[layer].line}</Text>
      <Text size="small" tone="muted">
        <code className="noo-code">{layerNotes[layer].path}</code> · grouped by what each one is for: {present.join(" · ")}
      </Text>
      <Catalogue layer={layer} summary={false} />
    </ToolScreen>
  );
}
