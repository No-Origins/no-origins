import Link from "next/link";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import {
  Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious,
} from "@no-origins/ui/components/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@no-origins/ui/components/table";
import { Text } from "@no-origins/ui/components/text";

import { NoAccess, PageShell, when } from "@/components/page-shell";
import { AUDIT_KINDS, AUDIT_PAGE, loadAudit, mayAll } from "@/lib/access";

export const metadata = { title: "Audit" };

const LINE = "Every change to who may do what, newest first. Nothing here can be edited or deleted, by anyone.";

/** Audit (Access.md A8): the record, fifty to a page, by the kind of change. */
export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  const may = await mayAll(["admin.audit.view"] as const);
  if (!may["admin.audit.view"]) {
    return <PageShell title="Audit" line={LINE}><NoAccess permission="admin.audit.view" /></PageShell>;
  }
  const query = await searchParams;
  const kind = typeof query.kind === "string" && (AUDIT_KINDS as readonly string[]).includes(query.kind) ? query.kind : undefined;
  const page = Math.max(0, Number(typeof query.page === "string" ? query.page : 0) || 0);
  const { events, total } = await loadAudit(page, kind);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE));
  const href = (next: { page?: number; kind?: string }) => {
    const params = new URLSearchParams();
    const k = "kind" in next ? next.kind : kind;
    if (k) params.set("kind", k);
    if (next.page) params.set("page", String(next.page));
    const s = params.toString();
    return s ? `/audit?${s}` : "/audit";
  };
  return (
    <PageShell title="Audit" line={LINE}>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="xs" variant={kind ? "outline" : "default"}><Link href={href({ kind: undefined })}>All</Link></Button>
        {AUDIT_KINDS.map((k) => (
          <Button key={k} asChild size="xs" variant={kind === k ? "default" : "outline"}>
            <Link href={href({ kind: k })}>{k}</Link>
          </Button>
        ))}
      </div>
      <Card>
        <CardContent>
          {events.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>What</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><Text role="caption" as="span">{when(e.at)}</Text></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Text role="body" as="span">{e.actorName ?? "the database"}</Text>
                        {e.actorKind === "agent" ? <Badge variant="secondary">Agent</Badge> : null}
                        {e.onBehalfOf ? <Badge variant="outline">for someone</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell><Text role="mono" as="span">{e.action}</Text></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Text role="body" tone="muted">Nothing recorded{kind ? ` of ${kind}` : ""} yet.</Text>
          )}
        </CardContent>
      </Card>
      {pages > 1 ? (
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
      ) : null}
    </PageShell>
  );
}
