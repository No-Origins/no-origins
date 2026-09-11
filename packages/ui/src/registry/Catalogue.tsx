import { Divider } from "../primitives/Divider";
import { Heading } from "../primitives/Heading";
import { Label } from "../primitives/Label";
import { Row } from "../primitives/Row";
import { Stack } from "../primitives/Stack";
import { Text } from "../primitives/Text";
import { byGroup, groups, registryHash } from "./index";
import type { PropSpec, RegistryEntry } from "./types";
import { entries } from "./entries";

/**
 * The catalogue, rendered from the registry.
 *
 * **It lives in the package because it has two consumers** — the public showcase at `design.no-origins.com` and
 * the admin's Design System section (Admin.md §5.1, read-only under R3). Copying the rendering into both apps
 * would be the same drift the registry itself exists to prevent: one declaration, and now one rendering of it.
 * The editor's palette is the third consumer and reads the array directly, because a palette is not a document.
 */

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
      <Stack gap={8} className="min-w-0">
        <Row gap={8} align="baseline">
          <Heading level={4}>{e.name}</Heading>
          <span className={e.status === "draft" ? "noo-placeholder__tag" : "noo-label text-muted"}>{e.status}</span>
        </Row>
        <Text size="small" tone="muted">{e.line}</Text>
        <Label className="text-muted">{e.kind.join(" · ")}</Label>
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
      </Stack>
      <div className="noo-cat__demo">{e.example()}</div>
    </article>
  );
}

export interface CatalogueProps {
  /** Shown above the groups — the hash, the counts, and what they mean. */
  summary?: boolean;
}

export function Catalogue({ summary = true }: CatalogueProps) {
  const hash = registryHash();
  const drafts = entries.filter((e) => e.status === "draft").length;
  return (
    <div>
      {summary ? (
        <>
          <Row gap={16}>
            <Text size="small" tone="muted" as="span">{entries.length} entries</Text>
            <Text size="small" tone="muted" as="span">{drafts} draft</Text>
            <Text size="small" tone="muted" as="span">registryHash <span className="noo-code">{hash}</span></Text>
          </Row>
          <Text size="small" tone="muted" className="mt-3 max-w-[66ch]">
            The hash fingerprints names, kinds, prop schemas and slots — and nothing else. It goes on every
            published version, so two publishes with equal hashes are guaranteed to render alike. It is blind to
            examples and defaults, because neither can change how an existing document renders.
          </Text>
        </>
      ) : null}

      {groups.map((group) => (
        <section key={group} className="noo-cat__group">
          <Heading level={3} className="capitalize">{group}</Heading>
          <Divider className="mt-4" />
          {byGroup(group).map((e) => <Entry key={e.name} e={e} />)}
        </section>
      ))}
    </div>
  );
}
