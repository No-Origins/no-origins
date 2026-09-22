import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { Button } from "@no-origins/ui/components/button";
import { Badge } from "@no-origins/ui/components/badge";
import { currentProfile } from "@/lib/supabase/server";
import { SetPassword } from "@/components/set-password";
import { Passkeys } from "@/components/passkeys";

export const metadata = { title: "Settings" };

/**
 * Settings (Admin.md §0.5) — the account controls that used to be the whole signed-in landing: who you are, your
 * passkeys, your password, and the way out. The home is the grid of feature cards now; this is the Settings card.
 */
export default async function SettingsPage() {
  const profile = await currentProfile();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/">
            <ArrowLeftIcon /> Home
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>No Origins · Admin</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{profile?.email ?? "Unknown account"}</span>
            {profile?.role ? <Badge variant="secondary">{profile.role}</Badge> : null}
          </div>
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
