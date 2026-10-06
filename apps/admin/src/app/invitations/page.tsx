import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";

import { InvitationsTable, InviteForm } from "@/components/invitations";
import { NoAccess, PageShell, when } from "@/components/page-shell";
import { loadInvitations, loadRoles, mayAll } from "@/lib/access";

export const metadata = { title: "Invitations" };

const LINE = "An address and the roles it gets when it signs up. Until sign-up opens, an invitation is the way in.";

/** Invitations (Access.md A7). */
export default async function InvitationsPage() {
  const may = await mayAll(["admin.invitations.manage"] as const);
  if (!may["admin.invitations.manage"]) {
    return <PageShell title="Invitations" line={LINE}><NoAccess permission="admin.invitations.manage" /></PageShell>;
  }
  const [invitations, roles] = await Promise.all([loadInvitations(), loadRoles()]);
  return (
    <PageShell title="Invitations" line={LINE}>
      <Card>
        <CardHeader>
          <CardTitle>Invite someone</CardTitle>
          <CardDescription>You can only invite with roles whose every permission you hold.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm roles={roles.filter((r) => r.builtIn !== "owner").map((r) => ({ id: r.id, name: r.name }))} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <InvitationsTable
            mayManage={may["admin.invitations.manage"]}
            invitations={invitations.map((i) => ({
              email: i.email,
              invited: when(i.invitedAt),
              expires: when(i.expiresAt),
              state: i.state,
              roles: i.roles.map((r) => r.name),
            }))}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
