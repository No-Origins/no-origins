import { Heading } from "../atoms/Heading";
import { Label } from "../atoms/Label";
import { Text } from "../atoms/Text";
import { byLayer, groups, layerNotes, layers, registryHash } from ".";
import type { PropSpec, RegistryEntry, RegistryLayer } from "./types";
import { entries } from "./entries";

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
 *
 * **`layer` renders one layer without its header** (2026-09-15). The showcase gives each layer its own screen —
 * `/components/atoms` and its two siblings — and that screen's own header already says which layer you are looking
 * at; a second heading under it would be the same sentence twice. The layer's own words live in `layerNotes`, so
 * the screen can print them in its lead and the catalogue and the route cannot disagree about what an atom is.
 */
export interface CatalogueProps {
  /** Shown above the layers — the hash, the counts, and what they mean. */
  summary?: boolean;
  /** Render this layer only, and without its header: the screen around it already names the layer. */
  layer?: RegistryLayer;
}

export function Catalogue({ summary = true, layer }: CatalogueProps) {
  const hash = registryHash();
  const drafts = entries.filter((e) => e.status === "draft").length;
  const shown = layer ? ([layer] as const) : layers;
  return (
    <div className={layer ? "noo-cat noo-cat--solo" : "noo-cat"}>
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

      {shown.map((l) => {
        const inLayer = byLayer(l);
        if (!inLayer.length) return null;
        /* the index comes from `layers`, never from the map above: filtered to one layer that would always read "layer 2" */
        const li = layers.indexOf(l);
        return (
          <section key={l} className="noo-cat__layer" aria-labelledby={layer ? undefined : `layer-${l}`}>
            {layer ? null : (
              <header className="noo-cat__layer-head">
                <Label className="noo-cat__eyebrow">layer {li + 2} of 6 · {inLayer.length} {inLayer.length === 1 ? "entry" : "entries"}</Label>
                <Heading level={2} id={`layer-${l}`}>{layerNotes[l].title}</Heading>
                <Text size="lead" tone="muted" className="noo-cat__lead">{layerNotes[l].line}</Text>
              </header>
            )}
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
