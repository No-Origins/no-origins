import { notFound } from "next/navigation";

import { PERMISSIONS } from "@no-origins/auth/permissions";

import { NoAccessPage } from "@/components/admin-pages";
import { RoleView } from "@/components/roles";
import { loadRole, mayAll } from "@/lib/access";

export const metadata = { title: "Role" };

const CATALOGUE = Object.entries(PERMISSIONS).map(([name, p]) => ({ name, app: p.app, sentence: p.sentence }));

/** One role: its permissions by app, ticked and then saved together (Access.md A3, A4, A7). */
export default async function RolePage({ params }: PageProps<"/roles/[id]">) {
  const { id } = await params;
  const { may } = await mayAll(["admin.roles.manage", "admin.people.view", "admin.invitations.manage"] as const);
  if (!may["admin.roles.manage"] && !may["admin.people.view"] && !may["admin.invitations.manage"]) {
    return <NoAccessPage title="Role" line="What a role may do." permission="admin.roles.manage" />;
  }
  const role = await loadRole(id);
  if (!role) notFound();
  const held = role.holders === 0 ? "Nobody holds this role yet." : role.holders === 1 ? "One account holds this role." : `${role.holders} accounts hold this role.`;
  const line = `${held}${role.isDefault ? " Everyone who signs up gets it." : ""}`;
  return <RoleView role={role} catalogue={CATALOGUE} mayManage={may["admin.roles.manage"]} line={line} />;
}
