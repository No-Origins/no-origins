import { AUTH_APP, isLocal, NO_ORIGINS_APPS } from "./apps";

const HOSTS = new Set<string>([AUTH_APP.host, ...NO_ORIGINS_APPS.map((app) => app.host)]);
const PORTS = new Set<number>([AUTH_APP.port, ...NO_ORIGINS_APPS.map((app) => app.port)]);

/**
 * Where to go after signing in (Admin.md §8.4) — the full address, or this site's home when `value` is not one the login
 * may send you to. `here` is the page asking: its origin, or any address on it.
 *
 * `next` comes off a URL, so it is attacker-controlled, and it is the one dangerous part of a login that serves every
 * app: a login that sends you anywhere hands the session to whatever page it sends you to. So it goes through only as:
 *
 * - **a place on this site** — a path, or this site's own address;
 * - **an app of No Origins** (`apps.ts`): `https:`, the host exactly one of the list, no port, no user or password. The
 *   auth app sends you back to the app that sent you; Orbit's sign-in comes back to Orbit;
 * - **on this machine**, and only when `here` is too: `http://localhost` (or 127.0.0.1) on one of the apps' ports.
 *
 * Anything else — another host, `javascript:`, a `//` or a backslash that a browser reads as another host — is this
 * site's home. Both ends read it, as they read the path-only rule before it: the callback (`routes.ts`) and the cards,
 * which navigate to `next` themselves after a password or a passkey. No imports but the list, so safe on either side.
 */
export function safeReturn(value: string | null | undefined, here: string): string {
  const site = new URL(here);
  const home = new URL("/", site).href;
  if (!value || value.includes("\\")) return home;
  let url: URL;
  try {
    url = new URL(value, site);
  } catch {
    return home;
  }
  if (url.username || url.password) return home;
  if (url.origin === site.origin) return url.href;
  if (isLocal(site.hostname)) return url.protocol === "http:" && isLocal(url.hostname) && PORTS.has(Number(url.port)) ? url.href : home;
  return url.protocol === "https:" && !url.port && HOSTS.has(url.hostname) ? url.href : home;
}
