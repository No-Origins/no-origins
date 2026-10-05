import { readPicture, signedIn } from "@/lib/store";

/**
 * The tour's pictures (Home.md H4, H9): `/tour/<name>.webp`, from the private store on Vercel and from the house's
 * folder anywhere else (`lib/store.ts`). Behind the sign-in twice — the gate in `proxy.ts`, which exempts no image, and
 * the question asked again here — and never cached anywhere but the browser that was let in.
 */
export async function GET(_request: Request, { params }: RouteContext<"/tour/[file]">) {
  if (!(await signedIn())) return new Response("Sign in first.", { status: 401 });
  const { file } = await params;
  const picture = await readPicture(file);
  if (!picture) return new Response("No such picture.", { status: 404 });
  return new Response(picture.body, {
    headers: { "content-type": picture.type, "cache-control": "private, max-age=3600" },
  });
}
