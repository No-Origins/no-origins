import { NoAccessPage } from "@/components/admin-pages";
import { PeopleView } from "@/components/people";
import { loadPeople, loadRoles, mayAll } from "@/lib/access";
import { when } from "@/lib/when";

export const metadata = { title: "People" };

/** People (Access.md A7): everyone and every agent, and their roles. */
export default async function PeoplePage() {
  const { me, may } = await mayAll(["admin.people.view", "admin.people.assign", "admin.people.remove"] as const);
  if (!may["admin.people.view"]) {
    return <NoAccessPage title="People" line="Everyone and every agent, and their roles." permission="admin.people.view" />;
  }
  const [people, roles] = await Promise.all([loadPeople(), loadRoles()]);
  return (
    <PeopleView
      people={people.map((p) => ({ ...p, joined: when(p.joinedAt), lastSignIn: when(p.lastSignInAt) }))}
      roles={roles.filter((r) => r.builtIn !== "owner").map((r) => ({ id: r.id, name: r.name }))}
      me={me}
      mayAssign={may["admin.people.assign"]}
      mayRemove={may["admin.people.remove"]}
    />
  );
}
