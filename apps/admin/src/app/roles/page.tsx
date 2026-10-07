import { PERMISSIONS } from "@no-origins/auth/permissions";

import { NoAccessPage } from "@/components/admin-pages";
import { RolesView } from "@/components/roles";
import { loadRoles, mayAll } from "@/lib/access";

export const metadata = { title: "Roles" };

/** Roles (Access.md A4, A7). */
export default async function RolesPage() {
  const may = await mayAll(["admin.roles.manage", "admin.people.view", "admin.invitations.manage"] as const);
  if (!may["admin.roles.manage"] && !may["admin.people.view"] && !may["admin.invitations.manage"]) {
    return <NoAccessPage title="Roles" line="A role is a set of permissions you make here." permission="admin.roles.manage" />;
  }
  const roles = await loadRoles();
  return <RolesView roles={roles} total={Object.keys(PERMISSIONS).length} mayManage={may["admin.roles.manage"]} />;
}
