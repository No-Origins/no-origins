"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import {
  Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious,
} from "@no-origins/ui/components/pagination";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

import { AdminPages, band, ColumnNames, NoteBox, RecordBox, wideOnly, type AdminItem } from "@/components/admin-pages";

export type AuditRow = { id: number; when: string; actorName: string | null; actorKind: "person" | "agent" | null; onBehalfOf: string | null; action: string };

// When · who · what.
const COLS = "@min-[600px]:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.2fr)]";

/**
 * Audit (Access.md A8): the record, newest first, by the kind of change — an event a record on the field. The database
 * is read fifty at a time; those fifty spill over the field's pages, and the next fifty are asked for after the last.
 */
export function AuditView({ events, kinds, kind, page, pages }: {
  events: AuditRow[];
  kinds: readonly string[];
  kind: string | undefined;
  page: number;
  pages: number;
}) {
  const items = React.useMemo<AdminItem[]>(() => {
    const href = (next: { page?: number; kind?: string }) => {
      const params = new URLSearchParams();
      const k = "kind" in next ? next.kind : kind;
      if (k) params.set("kind", k);
      if (next.page) params.set("page", String(next.page));
      const s = params.toString();
      return s ? `/audit?${s}` : "/audit";
    };
    return [
      // The kinds stay over the list on every page, above its column names; on a phone they wrap to two lines.
      { id: "kinds", repeat: true, span: band(1, 1, 2), render: () => <Kinds kinds={kinds} kind={kind} href={href} /> },
      ...(events.length
        ? [
            { id: "columns", repeat: true, span: wideOnly(), render: () => <ColumnNames className={COLS} names={["When", "Who", "What"]} /> },
            ...events.map((e): AdminItem => ({ id: `event-${e.id}`, span: band(1, 2, 2), render: () => <Event event={e} /> })),
          ]
        : [{ id: "none", span: band(1), render: () => <NoteBox>Nothing recorded{kind ? ` of ${kind}` : ""} yet.</NoteBox> }]),
      ...(pages > 1 ? [{ id: "more", span: band(1), render: () => <More page={page} pages={pages} href={href} /> }] : []),
    ];
  }, [events, kinds, kind, page, pages]);
  return <AdminPages title="Audit" line="Every change to who may do what, newest first. Nothing here can be edited or deleted, by anyone." items={items} />;
}

function Kinds({ kinds, kind, href }: { kinds: readonly string[]; kind: string | undefined; href: (next: { kind?: string }) => string }) {
  return (
    <Slot fill="background" inset={0} alignY="center">
      <div className="flex flex-wrap gap-2 px-6">
        <Button asChild size="xs" variant={kind ? "outline" : "default"}><Link href={href({ kind: undefined })}>All</Link></Button>
        {kinds.map((k) => (
          <Button key={k} asChild size="xs" variant={kind === k ? "default" : "outline"}>
            <Link href={href({ kind: k })}>{k}</Link>
          </Button>
        ))}
      </div>
    </Slot>
  );
}

function Event({ event: e }: { event: AuditRow }) {
  return (
    <RecordBox className={COLS}>
      <Text role="caption" as="span" className="truncate">{e.when}</Text>
      <div className="flex min-w-0 items-center gap-2">
        <Text role="body" as="span" className="truncate">{e.actorName ?? "the database"}</Text>
        {e.actorKind === "agent" ? <Badge variant="secondary">Agent</Badge> : null}
        {e.onBehalfOf ? <Badge variant="outline">for someone</Badge> : null}
      </div>
      <Text role="mono" as="span" className="truncate">{e.action}</Text>
    </RecordBox>
  );
}

function More({ page, pages, href }: { page: number; pages: number; href: (next: { page?: number }) => string }) {
  return (
    <Slot fill="background" inset={0} alignY="center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={href({ page: Math.max(0, page - 1) })} aria-disabled={page === 0} />
          </PaginationItem>
          <PaginationItem>
            <Text role="caption" as="span">Page {page + 1} of {pages}</Text>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href={href({ page: Math.min(pages - 1, page + 1) })} aria-disabled={page >= pages - 1} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Slot>
  );
}
