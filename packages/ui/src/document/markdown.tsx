import { Fragment, type ReactNode } from "react";
import { Chip } from "../atoms/Chip";
import { hues, type Hue } from "../tokens/tokens";
import { PanLink } from "./PanLink";

/**
 * Markdown, plus the declared inline directives (Scene-Schema.md §3.5; Admin.md R4). Deliberately small: a
 * document carries writing, not layout, so this is paragraphs, bullet lists, emphasis, code, links — and the two
 * directives the platform has, `:pan[text]{view=id}` and `:chip[text]{hue=peach}`. An unknown directive renders as
 * its plain text, so a document never breaks on one; it only loses the behaviour.
 *
 * The parser lives in the adapter, never in a component (`Text` renders children). It returns React, not HTML.
 */
export interface MarkdownContext {
  /** view id → href, so a pan-link is a working link too. */
  viewHref?: (view: string) => string | undefined;
}

export interface Rendered {
  /** Inline content when the source is one paragraph; block elements otherwise. */
  nodes: ReactNode;
  /** True when `nodes` holds block elements (`<p>`, `<ul>`) — the host wraps them in a `div`, never a `p`. */
  block: boolean;
}

const INLINE = /:([a-z]+)\[([^\]]*)\](?:\{([^}]*)\})?|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

function attrs(src: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!src) return out;
  for (const m of src.matchAll(/([a-zA-Z_][\w-]*)=("([^"]*)"|'([^']*)'|([^\s"']+))/g)) out[m[1]!] = m[3] ?? m[4] ?? m[5] ?? "";
  return out;
}

function directive(name: string, text: string, a: Record<string, string>, ctx: MarkdownContext, key: number): ReactNode {
  switch (name) {
    case "pan": {
      const view = a.view;
      if (!view) return text;
      return (
        <PanLink key={key} view={view} href={ctx.viewHref?.(view)}>
          {inline(text, ctx)}
        </PanLink>
      );
    }
    case "chip": {
      const hue = (hues as readonly string[]).includes(a.hue ?? "") ? (a.hue as Hue) : undefined;
      return (
        <Chip key={key} hue={hue}>
          {text}
        </Chip>
      );
    }
    default:
      return text;
  }
}

export function inline(src: string, ctx: MarkdownContext = {}): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of src.matchAll(INLINE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(src.slice(last, i));
    if (m[1] !== undefined) out.push(directive(m[1], m[2] ?? "", attrs(m[3]), ctx, k++));
    else if (m[4] !== undefined) out.push(<strong key={k++}>{inline(m[4], ctx)}</strong>);
    else if (m[5] !== undefined) out.push(<em key={k++}>{inline(m[5], ctx)}</em>);
    else if (m[6] !== undefined) out.push(<code key={k++}>{m[6]}</code>);
    else if (m[7] !== undefined)
      out.push(
        <a key={k++} href={m[8]}>
          {inline(m[7], ctx)}
        </a>,
      );
    last = i + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  if (out.length === 1) return out[0];
  return out.map((n, i) => (typeof n === "string" ? <Fragment key={`t${i}`}>{n}</Fragment> : n));
}

const isList = (b: string) => b.split("\n").every((l) => /^[-*]\s+/.test(l));

export function markdown(src: string, ctx: MarkdownContext = {}): Rendered {
  const blocks = src
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0) return { nodes: null, block: false };
  if (blocks.length === 1 && !isList(blocks[0]!)) return { nodes: inline(blocks[0]!.replace(/\n/g, " "), ctx), block: false };
  const nodes = blocks.map((b, i) =>
    isList(b) ? (
      <ul key={i}>
        {b.split("\n").map((l, j) => (
          <li key={j}>{inline(l.replace(/^[-*]\s+/, ""), ctx)}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{inline(b.replace(/\n/g, " "), ctx)}</p>
    ),
  );
  return { nodes, block: true };
}
