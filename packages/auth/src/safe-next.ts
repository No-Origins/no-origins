/**
 * `next` comes off a URL, so it is attacker-controlled. Only a same-site path is allowed through — anything with a
 * scheme or a `//` prefix is an open redirect wearing a helpful name, and a `javascript:` one is script on this origin
 * with the shared session cookie in reach. A backslash is refused too: browsers read `/\evil.com` as `//evil.com`.
 *
 * Both ends read it — the callback (`routes.ts`) and the login card, which navigates to `next` itself after a password
 * or a passkey — so it lives here, with no imports, safe on either side.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}
