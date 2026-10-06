import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { PERMISSIONS } from "@no-origins/auth/permissions";

import { NoAccess, PageShell } from "@/components/page-shell";
import { NewRole, RolesTable } from "@/components/roles";
import { loadRoles, mayAll } from "@/lib/access";

export const metadata = { title: "Roles" };

const LINE = "A role is a set of permissions you make here. Owner and Member are built in; Member is what a sign-up gets.";

/** Roles (Access.md A4, A7). */
export default async function RolesPage() {
  const may = await mayAll(["admin.roles.manage", "admin.people.view", "admin.invitations.manage"] as const);
  if (!may["admin.roles.manage"] && !may["admin.people.view"] && !may["admin.invitations.manage"]) {
    return <PageShell title="Roles" line={LINE}><NoAccess permission="admin.roles.manage" /></PageShell>;
  }
  const roles = await loadRoles();
  return (
    <PageShell title="Roles" line={LINE}>
      <Card>
        <CardContent>
          <RolesTable roles={roles} total={Object.keys(PERMISSIONS).length} />
        </CardContent>
      </Card>
      {may["admin.roles.manage"] ? (
        <Card>
          <CardHeader>
            <CardTitle>A new role</CardTitle>
            <CardDescription>Name it, then tick what it may do on its own page.</CardDescription>
          </CardHeader>
          <CardContent>
            <NewRole />
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
