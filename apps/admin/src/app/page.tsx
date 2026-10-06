import { HomeGrid } from "@/components/home-grid";
import { mayAll } from "@/lib/access";

export const metadata = { title: "Home" };

/**
 * The admin home (Admin.md §0.5) — the grid of feature cards. This supersedes §4's rail: the control surface
 * renders on the grid, the base layout. The gate lets nobody in without `admin.open`, so if this renders at all, you
 * are in; the cards for who may do what show only to whoever holds their page's permission (Access.md A7).
 */
export default async function Home() {
  const may = await mayAll(["admin.people.view", "admin.roles.manage", "admin.invitations.manage", "admin.audit.view"] as const);
  const hidden = [
    !may["admin.people.view"] && "people",
    !may["admin.roles.manage"] && !may["admin.people.view"] && "roles",
    !may["admin.invitations.manage"] && "invitations",
    !may["admin.audit.view"] && "audit",
  ].filter((id): id is string => typeof id === "string");
  return <HomeGrid hidden={hidden} />;
}
