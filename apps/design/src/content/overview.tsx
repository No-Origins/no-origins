"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { Text } from "@no-origins/ui/components/text";
import { band, onPhone } from "@/components/specimen";
import type { PageContent, Span, SpecimenItem } from "@/content";

const LAYERS = [
  {
    href: "/atoms",
    title: "Atoms",
    count: 18,
    note: "The indivisible ones — a control, a piece of text, a mark.",
  },
  {
    href: "/molecules",
    title: "Molecules",
    count: 42,
    note: "Two or more atoms with a job between them.",
  },
] as const;

/**
 * A layer card: six columns on `lg` and `xl`, so the two stand side by side and fill the page's 12-column band; on a
 * tablet two to a row as well, and one to a row on a phone.
 */
const LAYER: Record<string, Span> = { base: { cols: 6, rows: onPhone(3) }, sm: { cols: 6, rows: 3 }, md: { cols: 4, rows: 4 }, lg: { cols: 6, rows: 4 }, xl: { cols: 6, rows: 4 } };

/** A short piece of text; `code` inside it keeps the mono role (Type.md). */
const Code = ({ children }: { children: string }) => (
  <Text role="mono" as="code">
    {children}
  </Text>
);

/**
 * The overview, on the grid (2026-09-21) and arranged the portfolio's way (2026-09-22): one section, one screen where
 * it fits, on a 12-column band. The text sits in transparent boxes as `Text` roles, as wide as the band; the two
 * layer cards go on the field unwrapped — a Card is already a box. It reads top to bottom: intro, the cards in a row,
 * the notes.
 */
export const OVERVIEW: PageContent = {
  title: "Overview",
  variant: "transparent",
  // Two six-column cards divide 12 and not 16: the page keeps a 12-column measure on xl, centred like any other block.
  band: { xl: 12 },
  sections: [
    {
      id: "overview",
      items: [
        {
          id: "intro",
          span: band(3, 4),
          variant: "transparent",
          render: () => (
            <div className="flex h-full min-h-0 flex-col justify-end gap-3">
              <Badge variant="secondary" className="self-start">
                v2.0.0
              </Badge>
              <Text role="display" as="h1">
                The design system
              </Text>
              <Text role="body" tone="muted" className="max-w-3xl">
                Rebuilt on shadcn/ui — style <Code>radix-sera</Code>, base <Code>radix</Code>, base colour <Code>neutral</Code>, square
                corners, RTL on. Sixty components live in <Code>@no-origins/ui</Code>, plus the theme provider, and every app
                consumes them from source.
              </Text>
            </div>
          ),
        },
        ...LAYERS.map<SpecimenItem>((layer) => ({
          id: layer.href,
          span: LAYER,
          // A Card is already a box; wrapping it would clip its ring at the cell edge (Grid.md D21).
          variant: "none",
          render: () => (
            <Card size="sm" className="h-full min-h-0">
              <CardHeader>
                <CardTitle>{layer.title}</CardTitle>
                <CardDescription className="line-clamp-3">{layer.note}</CardDescription>
              </CardHeader>
              <CardContent>
                <Text role="mono" tone="muted">
                  {layer.count} components
                </Text>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button asChild size="sm">
                  <Link href={layer.href}>
                    Open <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ),
        })),
        {
          id: "notes",
          span: band(2, 3),
          variant: "transparent",
          render: () => (
            <div className="flex h-full min-h-0 max-w-3xl flex-col justify-start gap-1.5">
              <Text role="body" tone="muted">
                The grid is the base layout: everything an app lays out snaps onto it, this page included.
              </Text>
              <Text role="body" tone="muted">
                Organisms and templates are not here yet. The old ones went with the old system; the new ones get designed on top
                of this layer.
              </Text>
              <Text role="body" tone="muted">
                Press <Code>d</Code> to switch theme; scroll, ↑ ↓ or ← → to turn the page.
              </Text>
            </div>
          ),
        },
      ],
    },
  ],
};
