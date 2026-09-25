import type { CSSProperties } from "react";

import { cn } from "@no-origins/ui/lib/utils";

import type { Company } from "@/content/resume";

/**
 * A company's mark, straight on the cells it is given — no tile, no ring, no card (Portfolio.md P12, amended
 * 2026-09-25). It fills its box and keeps its proportion inside it: a square mark takes the whole box, a wide wordmark
 * (Radise) its whole width, centred down.
 *
 * The name is printed beside it wherever it is used, so the image is decoration and has no alt of its own.
 */
export function CompanyLogo({ company, className, style }: { company: Company; className?: string; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static logo at its own size, no optimisation wanted
    <img data-slot="company-logo" src={company.logo} alt="" className={cn("shrink-0 object-contain", className)} style={style} />
  );
}
