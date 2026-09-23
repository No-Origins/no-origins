import { sampled } from "@/content/site";

/**
 * The mark on anything written by the machine rather than by Bhargav (`content/sample.ts`).
 *
 * It borrows `Placeholder`'s `draft` tag on purpose: the site already had one honest way of saying "this is
 * scaffolding", and inventing a second would let the two drift apart. When a real slot is filled the tag stops
 * rendering by itself, because `sampled()` only knows about slots the sample actually supplied.
 */
export function SampleTag({ of }: { of: string }) {
  if (!sampled(of)) return null;
  return <span className="noo-placeholder__tag whitespace-nowrap">sample copy</span>;
}
