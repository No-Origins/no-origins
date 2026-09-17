import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { Button } from "@no-origins/ui/components/button";
import { Badge } from "@no-origins/ui/components/badge";
import { currentProfile } from "@/lib/supabase/server";
import { SetPassword } from "@/components/set-password";
import { Passkeys } from "@/components/passkeys";

export const metadata = { title: "Signed in" };

/**
 * The signed-in landing (Admin.md §4).
 *
 * The admin's screens — Projects, Systems, Products — went with the 1.0 design system and have not been rebuilt.
 * Until they are, the one thing the admin does is prove you are signed in: it shows who you are, lets you set a
 * password for next time, and lets you sign out. Middleware sends anyone unauthenticated to `/sign-in`, so if
 * this renders at all, you are in.
 */
export default async function Home() {
  const profile = await currentProfile();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>You're signed in</CardTitle>
          <CardDescription>No Origins · Admin</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{profile?.email ?? "Unknown account"}</span>
            {profile?.role ? <Badge variant="secondary">{profile.role}</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            The control surface itself is being rebuilt on the new design system. There is nothing to author yet —
            the live portfolio renders from source.
          </p>
          <form action="/auth/sign-out" method="post">
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
          <CardDescription>
            The fastest, phishing-resistant door — a tap with Face ID, Touch ID or a security key, no email
            round-trip. Register one here, then use it from the sign-in screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Passkeys />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Optional — set one for a faster sign-in than the magic link.</CardDescription>
        </CardHeader>
        <CardContent>
          <SetPassword />
        </CardContent>
      </Card>
    </main>
  );
}
