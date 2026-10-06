"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { Button } from "@no-origins/ui/components/button";
import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { Spinner } from "@no-origins/ui/components/spinner";
import { FieldSeparator } from "@no-origins/ui/components/field";
import { KeyRound } from "lucide-react";
import { supabaseBrowser } from "./client";
import { supabaseEnv } from "./env";
import { safeNext } from "./safe-next";
import { useWebAuthn } from "./webauthn";

/**
 * The login card (Admin.md §8.4) — composed entirely from `@no-origins/ui`, centered on the grid. Every no-origins
 * app signs in through it, named by `app`, into the one session they share (`cookies.ts`).
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
function LoginCardInner({ app }: { app: string }) {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const linkFailed = params.get("error") === "link";
  const tokenHash = params.get("token_hash");
  const tokenType = params.get("type");

  // Arrived by a magic link: the callback handed the token hash here rather than spend it on a GET (`routes.ts`), and
  // the card posts it back — the one request that signs in, which a mail client's preview never makes.
  if (tokenHash && tokenType) {
    return <ConfirmCard app={app} tokenHash={tokenHash} type={tokenType} next={next} />;
  }

  // Signed in, but this account cannot open the app (Access.md A6): the gate sent it here. Say so, and offer the way out —
  // never a sign-in form, which would only sign the same account in again.
  if (params.get("denied")) return <DeniedCard app={app} />;

  // A development server with no Supabase keys has nothing to sign in to: an app that opens without them (the motion
  // studio and Orbit, `openWithoutKeys`) is already open, so the card says so rather than a form that cannot send.
  if (!supabaseEnv()) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>No sign-in here</CardTitle>
          <CardDescription>No Origins · {app}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Alert>
              <AlertTitle>This server has no Supabase keys</AlertTitle>
              <AlertDescription>
                On a development server without them, this app is open: there is nothing to sign in to.
                To sign in locally, give it the local stack&apos;s keys in its .env.local (see its .env.example).
              </AlertDescription>
            </Alert>
            <Button asChild>
              <a href={next}>Open {app}</a>
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          No Origins · {app}. Access is by invitation — the list of people who can sign in is the list of people
          who have been invited.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkFailed ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>That link did not work</AlertTitle>
            <AlertDescription>It may have been used already, or expired — a link lasts an hour. Ask for another.</AlertDescription>
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

/**
 * Signed in, without the app's permission (Access.md A6). A sign-out is a POST to the app's own `/auth/sign-out`, which
 * signs out of every app and lands on this page's form; the owner gives access from the admin's People page.
 */
function DeniedCard({ app }: { app: string }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>No access to {app}</CardTitle>
        <CardDescription>No Origins · {app}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Alert>
            <AlertTitle>This account cannot open {app}</AlertTitle>
            <AlertDescription>
              You are signed in, but your roles do not include {app}. Sign out to use another account, or ask the owner
              for access.
            </AlertDescription>
          </Alert>
          <form action="/auth/sign-out" method="post">
            <Button type="submit" className="w-full">Sign out</Button>
          </form>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

/**
 * The last step of a magic link: a form that posts the token hash to the callback, submitted the moment it mounts,
 * with its button there for a browser that did not run the script. The action carries the hash in its query, the
 * same place the GET read it, so `authConfirm` reads one shape.
 */
function ConfirmCard({ app, tokenHash, type, next }: { app: string; tokenHash: string; type: string; next: string }) {
  const form = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);
  const action = `/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;

  useEffect(() => {
    // Once, whatever React does with effects in development: a second POST would find the hash already spent.
    if (submitted.current) return;
    submitted.current = true;
    form.current?.requestSubmit();
  }, []);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Signing you in</CardTitle>
        <CardDescription>No Origins · {app}</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={form} method="post" action={action}>
          <FieldGroup>
            <Button type="submit">
              <Spinner /> Sign in
            </Button>
          </FieldGroup>
        </form>
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
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    try {
      const supabase = supabaseBrowser();
      await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
    } catch {
      // Not an answer from the server (that is never shown, below) but the request not getting there at all — no
      // network, or no server: say so, and let it be tried again, rather than "Sending…" for ever.
      setState("failed");
      return;
    }
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
        {state === "failed" ? (
          <Alert variant="destructive">
            <AlertTitle>The link could not be sent</AlertTitle>
            <AlertDescription>Nothing reached the sign-in server. Check the connection and try again.</AlertDescription>
          </Alert>
        ) : null}
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
    // A full navigation so the proxy sees the fresh session cookie and lands us on `next`.
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

/** The card, for `app` — the name it signs in to ("Admin", "Motion studio"). */
export function LoginCard({ app }: { app: string }) {
  // `useSearchParams` needs a Suspense boundary or the whole route opts out of static rendering.
  return (
    <Suspense fallback={null}>
      <LoginCardInner app={app} />
    </Suspense>
  );
}
