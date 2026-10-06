import { notFound } from "next/navigation";

import { Card, CardContent } from "@no-origins/ui/components/card";
import { PERMISSIONS } from "@no-origins/auth/permissions";

import { NoAccess, PageShell } from "@/components/page-shell";
import { RoleEditor } from "@/components/roles";
import { loadRoles, mayAll } from "@/lib/access";

export const metadata = { title: "Role" };

const CATALOGUE = Object.entries(PERMISSIONS).map(([name, p]) => ({ name, app: p.app, sentence: p.sentence }));

/** One role: its permissions by app (Access.md A3, A4). */
export default async function RolePage({ params }: PageProps<"/roles/[id]">) {
  const { id } = await params;
  const may = await mayAll(["admin.roles.manage", "admin.people.view", "admin.invitations.manage"] as const);
  if (!may["admin.roles.manage"] && !may["admin.people.view"] && !may["admin.invitations.manage"]) {
    return <PageShell title="Role" line="What a role may do."><NoAccess permission="admin.roles.manage" /></PageShell>;
  }
  const role = (await loadRoles()).find((r) => r.id === id);
  if (!role) notFound();
  const held = role.holders === 0 ? "Nobody holds this role yet." : role.holders === 1 ? "One account holds this role." : `${role.holders} accounts hold this role.`;
  const line = `${held}${role.isDefault ? " Everyone who signs up gets it." : ""}`;
  return (
    <PageShell title={role.name} line={line}>
      <Card>
        <CardContent>
          <RoleEditor role={role} catalogue={CATALOGUE} mayManage={may["admin.roles.manage"]} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
