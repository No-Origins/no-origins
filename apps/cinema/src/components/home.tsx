"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";

import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import { Grid, GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

/** An asset as the home page shows it: what it is called and is, its version, and how many controls it has. */
export type AssetCard = { id: string; label: string; description: string; version: number; controls: number };

/** A card's size in cells, and the most cells across the sections take. */
const CARD = { cols: 6, rows: 3 };
const WIDEST = 20;

/**
 * The home page's field (Cinema.md F11; the placing mine): its name, then each section, a heading row (the section's
 * icon in violet and its word, centred, no border, as the portfolio's sections have) with its cards side by side under
 * it, a cell of air between them. Assets is the first section, and so far the only one. An asset's card opens its
 * bench.
 */
function Sections({ assets }: { assets: AssetCard[] }) {
  const metrics = useGridMetrics();
  if (!metrics) return null;
  const width = Math.min(metrics.cols, WIDEST);
  const start = Math.floor((metrics.cols - width) / 2) + 1;
  const card = Math.min(width, CARD.cols);
  const across = Math.max(1, Math.floor((width + 1) / (card + 1)));
  // The cards of each row are centred under the heading.
  const firstOf = (index: number) => {
    const inRow = Math.min(across, assets.length - Math.floor(index / across) * across);
    return start + Math.floor((width - (inRow * card + (inRow - 1))) / 2);
  };
  return (
    <>
      <GridItem col={start} row={1} colSpan={width} rowSpan={2}>
        <Slot fill="transparent" inset={0} alignX="center" alignY="center">
          <Text role="display" as="h1" align="center">Cinema Studio</Text>
        </Slot>
      </GridItem>
      <GridItem col={start} row={4} colSpan={width} rowSpan={1}>
        <Slot fill="background" inset={12} alignX="center" alignY="center">
          <div className="flex min-w-0 items-center gap-2">
            <Boxes aria-hidden className="size-5 shrink-0 text-secondary" />
            <Text as="h2" className="truncate">Assets</Text>
          </div>
        </Slot>
      </GridItem>
      {assets.length === 0 ? (
        <GridItem col={start} row={5} colSpan={width} rowSpan={1}>
          <Slot fill="transparent" inset={0} alignX="center" alignY="center">
            <Text role="body" tone="muted" align="center">No assets yet. Ask Claude for one.</Text>
          </Slot>
        </GridItem>
      ) : null}
      {assets.map((asset, index) => (
        <GridItem
          key={asset.id}
          col={firstOf(index) + (index % across) * (card + 1)}
          row={5 + Math.floor(index / across) * (CARD.rows + 1)}
          colSpan={card}
          rowSpan={CARD.rows}
        >
          <Slot fill="transparent" inset={0} alignX="stretch" alignY="stretch">
            <Link href={`/asset/${asset.id}`} className="block size-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card size="sm" className="size-full shadow-none">
                <CardHeader>
                  <Text role="heading" as="h3" className="truncate">{asset.label}</Text>
                  <Text role="caption">{`Version ${asset.version} · ${asset.controls} controls`}</Text>
                </CardHeader>
                <CardContent>
                  <Text role="body" tone="muted" className="line-clamp-3">{asset.description}</Text>
                </CardContent>
              </Card>
            </Link>
          </Slot>
        </GridItem>
      ))}
    </>
  );
}

/** The studios' grid: the field drawn, the pointer a violet ring, no intro (Grid.md D49). */
export function Home({ assets }: { assets: AssetCard[] }) {
  return (
    <Grid overlay cursor>
      <Sections assets={assets} />
    </Grid>
  );
}
