/**
 * Every app of No Origins, in the order the repo-root CLAUDE.md names them, and where each stands (Status.md S2).
 * **Every one is in progress** (his, 2026-10-03: "that should show all our apps and each one of it is still in
 * progress"), and the liquid beside each is 40% full (his: "Fill only 40% of the liquid"). The page is this data: to
 * change what it says of an app, change it here.
 */
export type AppStatus = {
  id: string;
  name: string;
  /** Its host, which is its link. */
  host: string;
  /** Where it stands, in a word or two. */
  state: string;
  /** How far along it is, 0 to 1: the liquid's level. */
  done: number;
};

const IN_PROGRESS = { state: "In progress", done: 0.4 } as const;

export const APPS: readonly AppStatus[] = [
  { id: "portfolio", name: "Portfolio", host: "hiddenstack.no-origins.com", ...IN_PROGRESS },
  { id: "design", name: "Design", host: "design.no-origins.com", ...IN_PROGRESS },
  { id: "admin", name: "Admin", host: "admin.no-origins.com", ...IN_PROGRESS },
  { id: "engineering", name: "Engineering", host: "engineering.no-origins.com", ...IN_PROGRESS },
  { id: "motion", name: "Motion", host: "motion.no-origins.com", ...IN_PROGRESS },
  { id: "orbit", name: "Orbit", host: "orbit.no-origins.com", ...IN_PROGRESS },
  { id: "home", name: "Home", host: "home.no-origins.com", ...IN_PROGRESS },
  { id: "status", name: "Status", host: "status.no-origins.com", ...IN_PROGRESS },
];
