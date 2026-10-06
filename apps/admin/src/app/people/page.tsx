import { Card, CardContent } from "@no-origins/ui/components/card";

import { NoAccess, PageShell, when } from "@/components/page-shell";
import { PeopleTable } from "@/components/people-table";
import { loadPeople, loadRoles, mayAll, myId } from "@/lib/access";

export const metadata = { title: "People" };

/** People (Access.md A7): everyone and every agent, and their roles. */
export default async function PeoplePage() {
  const may = await mayAll(["admin.people.view", "admin.people.assign", "admin.people.remove"] as const);
  if (!may["admin.people.view"]) {
    return <PageShell title="People" line="Everyone and every agent, and their roles."><NoAccess permission="admin.people.view" /></PageShell>;
  }
  const [people, roles, me] = await Promise.all([loadPeople(), loadRoles(), myId()]);
  return (
    <PageShell title="People" line="Everyone and every agent, and their roles. Taking a role signs the person out at once.">
      <Card>
        <CardContent>
          <PeopleTable
            people={people.map((p) => ({ ...p, joined: when(p.joinedAt), lastSignIn: when(p.lastSignInAt) }))}
            roles={roles.filter((r) => r.builtIn !== "owner").map((r) => ({ id: r.id, name: r.name }))}
            me={me}
            mayAssign={may["admin.people.assign"]}
            mayRemove={may["admin.people.remove"]}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
