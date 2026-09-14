import { Heading } from "../atoms/Heading";
import { Label } from "../atoms/Label";
import { Text } from "../atoms/Text";
import { byLayer, groups, layers, registryHash } from ".";
import type { PropSpec, RegistryEntry, RegistryLayer } from "./types";
import { entries } from "./entries";

/**
 * The catalogue, rendered from the registry — **grouped by Atomic layer** (Atomic.md §6 step 4), then by the
 * palette's groups inside each layer, so the reading order is the build order: what a thing is made of comes first.
 *
 * **It lives in the package because it has two consumers** — the public showcase at `design.no-origins.com` and
 * the admin's Design System section (Admin.md §5.1, read-only under R3). Copying the rendering into both apps
 * would be the same drift the registry itself exists to prevent: one declaration, and now one rendering of it.
 * The editor's palette is the third consumer and reads the array directly, because a palette is not a document.
 *
 * Every demo stands in a ground-coloured well, so a component is seen on the surface it will actually be used on.
 */
const LAYER: Record<RegistryLayer, { title: string; line: string }> = {
  atom: { title: "Atoms", line: "One thing, one job — the pieces everything else is made of. They read tokens and nothing else." },
  molecule: { title: "Molecules", line: "Atoms combined into one thing with one job: a field, a header, a control." },
  organism: { title: "Organisms", line: "Molecules and atoms assembled into a piece of a screen: a card, a menu, a grid." },
};

/** A PropSpec as one readable line. The inspector renders controls from the same shape (Scene-Schema.md §3.1). */
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
  return spec.default !== undefined ? `${base} · default ${JSON.stringify(spec.default)}` : base;
}

function Entry({ e }: { e: RegistryEntry }) {
  return (
    <article className="noo-cat__entry" id={e.name}>
      <div className="noo-cat__spec">
        <div className="noo-cat__name">
          <Heading level={4}>{e.name}</Heading>
          <span className="noo-cat__status" data-status={e.status}>{e.status}</span>
        </div>
        <Text size="small" tone="muted">{e.line}</Text>
        <Label className="noo-cat__kind">{e.kind.join(" · ")}</Label>
        <div className="noo-cat__api">
          {Object.entries(e.props).map(([k, spec]) => (
            <p key={k}>
              <b>{k}</b>{spec.required ? <i>*</i> : null} {describe(spec)}
            </p>
          ))}
          {Object.entries(e.slots ?? {}).map(([k, slot]) => (
            <p key={k}>
              <b>{k}</b> slot · {slot.admits === "blocks" ? "blocks" : slot.admits.join(", ")}
            </p>
          ))}
        </div>
      </div>
      <div className="noo-cat__demo">{e.example()}</div>
    </article>
  );
}

export interface CatalogueProps {
  /** Shown above the layers — the hash, the counts, and what they mean. */
  summary?: boolean;
}

export function Catalogue({ summary = true }: CatalogueProps) {
  const hash = registryHash();
  const drafts = entries.filter((e) => e.status === "draft").length;
  return (
    <div className="noo-cat">
      {summary ? (
        <div className="noo-cat__summary">
          <div className="noo-cat__counts">
            <Text size="small" tone="muted" as="span">{entries.length} entries</Text>
            <Text size="small" tone="muted" as="span">{drafts} draft</Text>
            <Text size="small" tone="muted" as="span">registryHash <span className="noo-code">{hash}</span></Text>
          </div>
          <Text size="small" tone="muted" className="noo-cat__note">
            The hash fingerprints names, kinds, prop schemas and slots — and nothing else. It goes on every
            published version, so two publishes with equal hashes are guaranteed to render alike. It is blind to
            examples and defaults, because neither can change how an existing document renders.
          </Text>
        </div>
      ) : null}

      {layers.map((layer, li) => {
        const inLayer = byLayer(layer);
        if (!inLayer.length) return null;
        return (
          <section key={layer} className="noo-cat__layer" aria-labelledby={`layer-${layer}`}>
            <header className="noo-cat__layer-head">
              <Label className="noo-cat__eyebrow">layer {li + 2} of 6 · {inLayer.length} {inLayer.length === 1 ? "entry" : "entries"}</Label>
              <Heading level={2} id={`layer-${layer}`}>{LAYER[layer].title}</Heading>
              <Text size="lead" tone="muted" className="noo-cat__lead">{LAYER[layer].line}</Text>
            </header>
            {groups.map((group) => {
              const es = inLayer.filter((e) => e.group === group);
              if (!es.length) return null;
              return (
                <div key={group} className="noo-cat__group">
                  <Label className="noo-cat__group-title">{group}</Label>
                  {es.map((e) => <Entry key={e.name} e={e} />)}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
