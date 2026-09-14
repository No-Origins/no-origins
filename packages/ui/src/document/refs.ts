import { refSchema, type Ref } from "./schema";

/**
 * Refs (Scene-Schema.md §3.4): `{ "$ref": "site.tagline" }` names a key in the project's content, which lives beside
 * the document and never inside it. A path is dotted, and an integer segment indexes an array — `work.roles.0`.
 * The host hands the content in; the adapter only ever reads it.
 */
export function isRef(value: unknown): value is Ref {
  return refSchema.safeParse(value).success;
}

export function resolveRef(path: string, content: unknown): unknown {
  let cur: unknown = content;
  for (const key of path.split(".")) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** `when` is a presence test (§1.4): not undefined, null, an empty string or an empty array. Nothing else. */
export function present(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/** Where a ref sat in the props tree, and what it named. */
export interface RefSite {
  path: string;
  ref: string;
}

export type Unresolved = RefSite;

/**
 * Replaces every ref in a props tree with what it names. Arrays and plain objects are walked; anything else is
 * returned as is. A ref that names nothing becomes `undefined` and is reported, so a missing content key is a
 * visible defect on the node rather than a silently empty prop.
 *
 * `read` collects the refs that DID resolve. The adapter needs the list to answer a question the resolved props
 * can no longer answer — which content keys these props came from — so that copy marked sampled can be tagged
 * where it lands (Admin.md §6.5c F4).
 */
export function resolveDeep(value: unknown, content: unknown, path: string, out: Unresolved[], read?: RefSite[]): unknown {
  if (isRef(value)) {
    const got = resolveRef(value.$ref, content);
    if (got === undefined) out.push({ path, ref: value.$ref });
    else read?.push({ path, ref: value.$ref });
    return got;
  }
  if (Array.isArray(value)) return value.map((v, i) => resolveDeep(v, content, `${path}.${i}`, out, read));
  if (value && typeof value === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) o[k] = resolveDeep(v, content, `${path}.${k}`, out, read);
    return o;
  }
  return value;
}
