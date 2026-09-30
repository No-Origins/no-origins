import type { NextRequest } from "next/server";
import { authGate } from "@no-origins/auth/proxy";

/**
 * The gate (Admin.md §8.4): the shared sign-in's, `@no-origins/auth`, one session for every no-origins app. The admin
 * never opens without its keys — every route in it reads the database.
 */
export function proxy(request: NextRequest) {
  return authGate(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
