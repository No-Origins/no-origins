import { FAMILIES, EASES, type Family, type FamilyId, type Token, type Value, type Values } from "@/content/families";

/**
 * Reading and writing the motion tokens (Motion.md M3). The decided values are whatever globals.css says, read off
 * the page's root — never copied into the studio, so a pick committed to the package shows up here as "today" with no
 * second edit. A token not in globals.css yet — a motion still being designed — starts from its family's preset A. A
 * value on a jig is a number in the token's unit, or an ease or a choice as CSS.
 */

/** An ease as one canonical string, so a minified stylesheet's `cubic-bezier(.4,0,.2,1)` matches the list's. */
export function normalizeEase(css: string): string {
  const value = css.trim();
  const match = /^cubic-bezier\(([^)]*)\)$/.exec(value.replace(/\s+/g, ""));
  if (!match) return value;
  const nums = match[1]!.split(",").map(Number);
  return nums.length === 4 && nums.every(Number.isFinite) ? `cubic-bezier(${nums.join(", ")})` : value;
}

/** A token's value as it reads in CSS. */
export function parseToken(token: Token, raw: string): Value | null {
  const value = raw.trim();
  if (!value) return null;
  switch (token.kind) {
    case "ease":
      return normalizeEase(value);
    case "ms": {
      const m = /^(-?[\d.]+)(ms|s)$/.exec(value);
      return m ? Number(m[1]) * (m[2] === "s" ? 1000 : 1) : null;
    }
    case "scale":
    case "share": {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case "choice":
      return token.choices?.some((c) => c.value === value) ? value : null;
  }
}

/** A value written as CSS, `tempo` times slower when it is a duration — the stage's slow motion (M6). */
export function tokenCss(token: Token, value: Value, tempo = 1): string {
  switch (token.kind) {
    case "ms":
      return `${Math.round(Number(value) * tempo)}ms`;
    case "scale":
    case "share":
      return `${Number(value)}`;
    case "ease":
    case "choice":
      return String(value);
  }
}

/** A value as the jig says it: `100ms`, `95%`, `+15%`, the ease's name or the choice's. */
export function tokenLabel(token: Token, value: Value): string {
  if (token.unit) {
    const n = Number(Number(value).toFixed(3));
    return `${n}${token.unit === "degrees" ? "°" : token.unit === "cells" ? "c" : token.unit === "multiplier" ? "×" : token.unit === "px" ? "px" : ""}`;
  }
  switch (token.kind) {
    case "ms":
      return `${Math.round(Number(value))}ms`;
    case "scale":
      return `${Math.round(Number(value) * 100)}%`;
    case "share": {
      const pct = Math.round(Number(value) * 100);
      return (token.min ?? 0) < 0 && pct > 0 ? `+${pct}%` : `${pct}%`;
    }
    case "ease":
      return EASES.find((e) => e.value === value)?.label ?? String(value);
    case "choice":
      return token.choices?.find((c) => c.value === value)?.label ?? String(value);
  }
}

/**
 * Every family's decided values: off the document's root where globals.css has the token, else preset A's. Only in the
 * browser.
 */
export function readDecided(): Record<FamilyId, Values> {
  const style = getComputedStyle(document.documentElement);
  const out = {} as Record<FamilyId, Values>;
  for (const family of FAMILIES) {
    const start = family.presets.find((p) => p.id === "A")?.values ?? {};
    const values: Values = {};
    for (const token of family.tokens) {
      const v = parseToken(token, style.getPropertyValue(token.name)) ?? start[token.name];
      if (v !== undefined && v !== null) values[token.name] = v;
    }
    out[family.id] = values;
  }
  return out;
}

export const sameValues = (family: Family, a: Values | undefined, b: Values | undefined) =>
  !!a && !!b && family.tokens.every((t) => a[t.name] === b[t.name]);

/**
 * The block a jig hands back (M6): the family's tokens as the lines that would go into globals.css, under a line saying
 * where the values started. What moved is for the reader to see on the jig; the block stays short enough to read.
 */
export function settingsText(family: Family, values: Values, decided: Values, from: string): string {
  const lines = family.tokens.map((t) => `${t.name}: ${tokenCss(t, values[t.name] ?? decided[t.name] ?? "")};`);
  return [`/* ${family.label} — ${from} */`, ...lines].join("\n");
}
