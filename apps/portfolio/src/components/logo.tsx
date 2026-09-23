import { cn } from "@no-origins/ui/lib/utils";

import type { Company } from "@/content/resume";

/**
 * A company's mark on a small white tile — white because the marks are the companies' own colours and have to read on
 * the dark theme too; the hairline separates the tile from a light card. Marks are square and wordmarks are wide, so
 * the tile is fixed in height and takes the width the logo needs.
 *
 * One mark, on the role card that is about that company. The strip of all four that used to sit on the profile card
 * went on 2026-09-21 (Portfolio.md P9) — the first screen is who he is, not where he has been.
 */
export function CompanyLogo({ company, size = "default", className }: { company: Company; size?: "sm" | "default" | "lg"; className?: string }) {
  const h = size === "lg" ? "h-10 px-2 [&_img]:h-6 [&_img]:max-w-24" : size === "sm" ? "h-6 px-1 [&_img]:h-3.5 [&_img]:max-w-14" : "h-8 px-1.5 [&_img]:h-5 [&_img]:max-w-20";
  return (
    <span
      data-slot="company-logo"
      title={company.name}
      className={cn("ring-border inline-flex shrink-0 items-center justify-center bg-white ring-1", h, className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a static logo at its own size, no optimisation wanted */}
      <img src={company.logo} alt={company.name} className="w-auto object-contain" />
    </span>
  );
}
