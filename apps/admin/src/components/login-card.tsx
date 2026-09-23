"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { Button } from "@no-origins/ui/components/button";
import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { FieldSeparator } from "@no-origins/ui/components/field";
import { KeyRound } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useWebAuthn } from "@/lib/webauthn";

/**
 * The admin's login card (Admin.md §8.4) — composed entirely from `@no-origins/ui`, centered on the grid.
 *
 * Two ways in, one door:
 * - **Magic link** is the membership path. It says the same thing whatever happens — the allowlist IS the
 *   membership rule, so a page that distinguished "not on the list" from "link sent" would be a membership oracle
 *   for anyone with the URL. The person who owns the address learns the outcome by reading their email.
 * - **Password** is the convenience path, for an account that already has one (set it while signed in). Supabase
 *   returns the same "invalid login credentials" for a wrong password and an unknown address, so it is not an
 *   oracle either.
 * - **Passkey** is the fastest and safest door: a WebAuthn assertion signs you straight in, no email round-trip
 *   and nothing phishable. You register the passkey while signed in (the landing screen); this button uses it.
 *   It only appears when the browser has an authenticator, and it needs passkeys enabled on the server (§8.4).
 */
function LoginCardInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const linkFailed = params.get("error") === "link";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          No Origins · Admin. Access is by invitation — the list of people who can sign in is the list of people
          who have been invited.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkFailed ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>That link did not work</AlertTitle>
            <AlertDescription>It may have expired — they last fifteen minutes. Ask for another.</AlertDescription>
          </Alert>
        ) : null}

        <Tabs defaultValue="link">
          <TabsList className="w-full">
            <TabsTrigger value="link">Magic link</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="mt-6">
            <MagicLinkForm next={next} />
          </TabsContent>
          <TabsContent value="password" className="mt-6">
            <PasswordForm next={next} />
          </TabsContent>
        </Tabs>

        <PasskeyButton next={next} />
      </CardContent>
    </Card>
  );
}

function PasskeyButton({ next }: { next: string }) {
  // Only offer the door if the browser can open it. The server may still have passkeys off — that surfaces as
  // an error on click, not a missing button, which is the right failure for a rare case.
  const available = useWebAuthn();
  const [state, setState] = useState<"idle" | "signing">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!available) return null;

  async function signIn() {
    setState("signing");
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) {
      if (!/cancel|abort|NotAllowed/i.test(error.message)) setError("No passkey worked. Use a link or password.");
      setState("idle");
      return;
    }
    window.location.assign(next);
  }

  return (
    <>
      <FieldSeparator className="my-6">or</FieldSeparator>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Passkey sign-in failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button variant="outline" className="w-full" onClick={signIn} disabled={state === "signing"}>
        <KeyRound />
        {state === "signing" ? "Waiting for your device…" : "Sign in with a passkey"}
      </Button>
    </>
  );
}

function MagicLinkForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // The result is deliberately not read: an error here is mostly "not on the allowlist", and showing it would
    // answer a question this page must not answer.
    setState("sent");
  }

  if (state === "sent") {
    return (
      <FieldGroup>
        <Alert>
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>
            If <strong>{email}</strong> is on the list, a link is on its way. It expires in fifteen minutes.
          </AlertDescription>
        </Alert>
        <Button variant="ghost" onClick={() => setState("idle")}>
          Use a different address
        </Button>
      </FieldGroup>
    );
  }

  return (
    <form onSubmit={send}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="magic-email">Email</FieldLabel>
          <Input
            id="magic-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <FieldDescription>A link, by email. No password to lose, no account to create.</FieldDescription>
        </Field>
        <Button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send the link"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function PasswordForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "signing">("idle");
  const [error, setError] = useState<string | null>(null);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    setState("signing");
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      // Supabase collapses "wrong password" and "no such account" into one message — not an oracle. Show it.
      setError("Those credentials did not work.");
      setState("idle");
      return;
    }
    // A full navigation so the middleware sees the fresh session cookie and lands us on `next`.
    window.location.assign(next);
  }

  return (
    <form onSubmit={signIn}>
      <FieldGroup>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not sign in</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="password-email">Email</FieldLabel>
          <Input
            id="password-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <FieldDescription>Set a password from your account after signing in with a link.</FieldDescription>
        </Field>
        <Button type="submit" disabled={state === "signing"}>
          {state === "signing" ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  );
}

export function LoginCard() {
  // `useSearchParams` needs a Suspense boundary or the whole route opts out of static rendering.
  return (
    <Suspense fallback={null}>
      <LoginCardInner />
    </Suspense>
  );
}
