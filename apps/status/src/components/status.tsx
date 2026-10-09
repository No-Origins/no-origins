"use client";

import * as React from "react";

import { Card } from "@no-origins/ui/components/card";
import { Grid, GridItem } from "@no-origins/ui/components/grid";
import { Liquid } from "@no-origins/ui/components/liquid";
import { Text } from "@no-origins/ui/components/text";

import { APPS } from "@/content/apps";

/** The name's card, in cells: as wide as the field leaves beside the state and the liquid, three at the least, six at the most. */
const NAME_MIN = 3;
const NAME_MAX = 6;
/** The state's pill, in cells. */
const STATE_CELLS = 2;

type Field = { cols: number; rows: number };

/**
 * Where everything stands on the field (Status.md S3): the page's name on the first row, then a row an app — its name
 * and host, the state it is in, and beside it the liquid — one block centred on the field across and down. The rows
 * hold as many apps as they can after the name's; what the field has no room for is not shown, never scrolled.
 */
export function arrangeStatus({ cols, rows }: Field) {
  const name = Math.max(NAME_MIN, Math.min(NAME_MAX, cols - STATE_CELLS - 1));
  const width = name + STATE_CELLS + 1;
  const left = Math.floor((cols - width) / 2) + 1;
  const shown = Math.min(APPS.length, Math.max(0, rows - 1));
  const top = Math.max(1, Math.floor((rows - (1 + shown)) / 2) + 1);
  return { name, width, left, top, shown };
}

/**
 * The status page (Status.md): one `Grid` with the
 * overlay and the cursor, nothing else on the page. Each app is a row of three boxes on the field's cells — a card
 * with its name and its host, which is a link to it; a pill saying where it stands; and a cell of liquid (the
 * design system's `Liquid`, Motion.md M25) as full as the app is far along, 40% today, every one.
 */
export function StatusPage() {
  const [field, setField] = React.useState<Field | null>(null);
  const onMetrics = React.useCallback(
    (m: Field) => setField((prev) => (prev && prev.cols === m.cols && prev.rows === m.rows ? prev : { cols: m.cols, rows: m.rows })),
    [],
  );
  const placed = field ? arrangeStatus(field) : null;
  return (
    <Grid overlay cursor onMetrics={onMetrics}>
      {placed ? (
        <>
          <GridItem col={placed.left} row={placed.top} colSpan={placed.width} rowSpan={1} data-box="title" className="relative flex items-center">
            <Text role="hero" as="h1" className="truncate ps-4">
              Status
            </Text>
          </GridItem>
          {APPS.slice(0, placed.shown).map((app, i) => {
            const row = placed.top + 1 + i;
            const pct = Math.round(app.done * 100);
            return (
              <React.Fragment key={app.id}>
                <GridItem col={placed.left} row={row} colSpan={placed.name} rowSpan={1} data-box={`${app.id}-name`} className="relative">
                  <a
                    href={`https://${app.host}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${app.name}, ${app.host} (opens in a new tab)`}
                    className="group block size-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Card size="sm" className="size-full justify-center gap-0 px-4 py-0 transition-colors group-hover:border-primary">
                      <Text as="span" className="truncate font-semibold">
                        {app.name}
                      </Text>
                      <Text as="span" role="caption" className="truncate">
                        {app.host}
                      </Text>
                    </Card>
                  </a>
                </GridItem>
                <GridItem col={placed.left + placed.name} row={row} colSpan={STATE_CELLS} rowSpan={1} data-box={`${app.id}-state`} className="relative">
                  <Card size="sm" className="size-full items-center justify-center gap-0 px-3 py-0">
                    <Text as="span" className="truncate">
                      {app.state}
                    </Text>
                  </Card>
                </GridItem>
                <GridItem col={placed.left + placed.name + STATE_CELLS} row={row} colSpan={1} rowSpan={1} data-box={`${app.id}-liquid`} className="relative">
                  <Liquid level={app.done} label={`${app.name}: ${pct}% done`} />
                </GridItem>
              </React.Fragment>
            );
          })}
        </>
      ) : null}
    </Grid>
  );
}
