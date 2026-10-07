import { NoAccessPage } from "@/components/admin-pages";
import { InvitationsView } from "@/components/invitations";
import { loadInvitations, loadRoles, mayAll } from "@/lib/access";
import { when } from "@/lib/when";

export const metadata = { title: "Invitations" };

/** Invitations (Access.md A7). */
export default async function InvitationsPage() {
  const may = await mayAll(["admin.invitations.manage"] as const);
  if (!may["admin.invitations.manage"]) {
    return <NoAccessPage title="Invitations" line="An address and the roles it gets when it signs up." permission="admin.invitations.manage" />;
  }
  const [invitations, roles] = await Promise.all([loadInvitations(), loadRoles()]);
  return (
    <InvitationsView
      mayManage={may["admin.invitations.manage"]}
      roles={roles.filter((r) => r.builtIn !== "owner").map((r) => ({ id: r.id, name: r.name }))}
      invitations={invitations.map((i) => ({
        email: i.email,
        invited: when(i.invitedAt),
        expires: when(i.expiresAt),
        state: i.state,
        roles: i.roles.map((r) => r.name),
      }))}
    />
  );
}
