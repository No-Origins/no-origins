import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** POST only: a sign-out on GET is a sign-out any prefetch or image tag can perform. */
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/sign-in", request.url), { status: 303 });
}
