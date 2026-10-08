import type { Permission } from "./permissions";

/**
 * Every app of No Origins the login knows (Admin.md §8.4, Access.md A7): its host, the port it runs on locally (the
 * repo-root CLAUDE.md's), a line of what it is, and the permission that opens it — `null` for an app anyone may open.
 *
 * Two things read it. The return address (`safeReturn`): the login sends you back only to a host on this list. And the
 * auth app's page of apps: the public ones, and each gated one whose `<app>.open` the person holds. The order is the
 * order that page shows them.
 */
export type NoOriginsApp = {
  id: string;
  name: string;
  line: string;
  host: string;
  port: number;
  permission: Permission | null;
};

export const AUTH_APP = { id: "auth", name: "Account", host: "auth.no-origins.com", port: 3008 } as const;

export const NO_ORIGINS_APPS: readonly NoOriginsApp[] = [
  { id: "motion", name: "Motion", line: "The motion studio: every motion of the system, to try.", host: "motion.no-origins.com", port: 3004, permission: "motion.open" },
  { id: "orbit", name: "Orbit", line: "The agents, and how they look.", host: "orbit.no-origins.com", port: 3005, permission: null },
  { id: "home", name: "Home", line: "The house, and its tour.", host: "home.no-origins.com", port: 3006, permission: "home.open" },
  { id: "portfolio", name: "Portfolio", line: "Hiddenstack's work, played by the agents.", host: "hiddenstack.no-origins.com", port: 3000, permission: null },
  { id: "design", name: "Design", line: "The design system, every component in both themes.", host: "design.no-origins.com", port: 3001, permission: null },
  { id: "engineering", name: "Engineering", line: "What is built and how, to read.", host: "engineering.no-origins.com", port: 3003, permission: null },
  { id: "status", name: "Status", line: "Where every app stands.", host: "status.no-origins.com", port: 3007, permission: null },
  { id: "admin", name: "Admin", line: "People, roles, invitations and the audit log.", host: "admin.no-origins.com", port: 3002, permission: "admin.open" },
];

/** Whether `hostname` is this machine: then every app is `http://localhost:<its port>`. */
export function isLocal(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** An app's address, beside the page asking: its host in production, its port on this machine. */
export function appOrigin(app: { host: string; port: number }, here: string): string {
  const { protocol, hostname } = new URL(here);
  return isLocal(hostname) ? `${protocol}//${hostname}:${app.port}` : `https://${app.host}`;
}

/** The app an address belongs to, if any — by its host, or its port on this machine. */
export function appAt(address: string): NoOriginsApp | null {
  try {
    const url = new URL(address);
    return NO_ORIGINS_APPS.find((app) => (isLocal(url.hostname) ? Number(url.port) === app.port : url.hostname === app.host)) ?? null;
  } catch {
    return null;
  }
}
