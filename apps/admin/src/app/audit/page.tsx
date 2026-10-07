import { NoAccessPage } from "@/components/admin-pages";
import { AuditView } from "@/components/audit";
import { AUDIT_KINDS, AUDIT_PAGE, loadAudit, mayAll } from "@/lib/access";
import { when } from "@/lib/when";

export const metadata = { title: "Audit" };

/** Audit (Access.md A8): the record, fifty to a read, by the kind of change. */
export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  const { may } = await mayAll(["admin.audit.view"] as const);
  if (!may["admin.audit.view"]) {
    return <NoAccessPage title="Audit" line="Every change to who may do what." permission="admin.audit.view" />;
  }
  const query = await searchParams;
  const kind = typeof query.kind === "string" && (AUDIT_KINDS as readonly string[]).includes(query.kind) ? query.kind : undefined;
  const page = Math.max(0, Number(typeof query.page === "string" ? query.page : 0) || 0);
  const { events, total } = await loadAudit(page, kind);
  return (
    <AuditView
      events={events.map((e) => ({ id: e.id, when: when(e.at), actorName: e.actorName, actorKind: e.actorKind, onBehalfOf: e.onBehalfOf, action: e.action }))}
      kinds={AUDIT_KINDS}
      kind={kind}
      page={page}
      pages={Math.max(1, Math.ceil(total / AUDIT_PAGE))}
    />
  );
}
