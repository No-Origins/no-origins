import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * The gate, and the session refresh, in one pass (Admin.md §8.4).
 *
 * Two jobs that have to happen together. A Server Component cannot write cookies, so the refreshed access token
 * has nowhere to go unless something upstream of the render writes it — that is this. And because it is already
 * reading the user to do that, it is also the cheapest place to answer "is anyone signed in", before a page has
 * rendered anything.
 *
 * **`getUser()`, never `getSession()`.** `getSession` reads the cookie and believes it; `getUser` asks the auth
 * server whether the token is real. On a page that decides what you may see, believing the cookie is believing
 * whoever wrote it.
 *
 * This is not the only defence and is not meant to be — RLS is (§8.3). Middleware decides which screen you land
 * on; the database decides what is in it. A hole here shows you an empty admin, not someone else's data.
 */
const PUBLIC_PATHS = ["/sign-in", "/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    // Where they were going, so the link lands there rather than at the overview.
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
