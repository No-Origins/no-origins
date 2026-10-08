"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@no-origins/ui/components/input-otp";
import { Spinner } from "@no-origins/ui/components/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { Text } from "@no-origins/ui/components/text";

import { appAt } from "./apps";
import { ChallengeBox, useChallenge } from "./challenge";
import { supabaseBrowser } from "./client";
import { supabaseEnv } from "./env";
import { safeReturn } from "./safe-next";
import { CodeForm, SecondFactorCard, useSecondFactor } from "./second-factor";
import { useWebAuthn } from "./webauthn";

/**
 * The login's cards (Admin.md §8.4, step 5): signing in, making an account, a forgotten password and the new one, each
 * on the auth app's own page (`auth.no-origins.com`), every one composed from `@no-origins/ui`. His doors, 2026-10-08:
 *
 * - **Email and a password.** Making an account sends one mail to confirm the address; signing in sends none.
 * - **An email link or a code**, in the same mail, for an address with an account or without one: the link for this
 *   device, the code for another. It signs in, or makes the account.
 * - **A passkey**, to sign in only: Supabase registers one for an account that exists, so the account page offers one.
 *
 * **No answer says who is here.** A sign-up for an address that has an account is answered as any other (Supabase sends
 * no mail and says nothing), a link asked for says the same whatever happens, and a wrong password and an unknown
 * address are one "those did not work". Whoever owns the address learns the rest from their inbox.
 *
 * **`next` is a full address** (`safe-next.ts`): where the person was going, on any app of No Origins, read only through
 * `safeReturn` — so a card renders once it knows the page it is on (`useHere`), never on the server's guess.
 */

/** The six digits of a mailed code: Supabase's `otp_length` (`supabase/config.toml`, here and on the hosted project). */
export const EMAIL_CODE_LENGTH = 6;

const never = () => () => {};

/** This page's origin, once in the browser: `null` on the server and through hydration, so the two never disagree. */
function useHere(): string | null {
  return React.useSyncExternalStore<string | null>(never, () => window.location.origin, () => null);
}

/** Where the person is going, and the app it is on: the auth app's own home when `next` names nowhere it may go. */
export function useNext(): { raw: string | null; next: string | null; app: string | null } {
  const raw = useSearchParams().get("next");
  const here = useHere();
  const next = here ? safeReturn(raw, here) : null;
  const app = next && new URL(next).origin !== here ? appAt(next)?.name ?? null : null;
  return { raw, next, app };
}

/** A link to another of the login's pages, carrying `next` on. */
function withNext(path: string, raw: string | null) {
  return raw ? `${path}?next=${encodeURIComponent(raw)}` : path;
}

function callback(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** A card of the login: its title, and the app it opens under it. */
function LoginFrame({ title, app, children }: { title: string; app: string | null; children: React.ReactNode }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{app ? `No Origins · ${app}` : "No Origins"}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** A development server with no Supabase keys has nothing to sign in to. */
function NoKeysCard({ app, next }: { app: string | null; next: string }) {
  return (
    <LoginFrame title="No sign-in here" app={app}>
      <FieldGroup>
        <Alert>
          <AlertTitle>This server has no Supabase keys</AlertTitle>
          <AlertDescription>
            On a development server without them there is nothing to sign in to. To sign in locally, give the app the
            local stack&apos;s keys in its .env.local (see its .env.example).
          </AlertDescription>
        </Alert>
        <Button asChild>
          <a href={next}>{app ? `Open ${app}` : "Continue"}</a>
        </Button>
      </FieldGroup>
    </LoginFrame>
  );
}

/** Six digits in the system's circles; filled, it submits itself. */
function EmailCode({ id, value, onChange, onComplete, disabled }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <InputOTP id={id} maxLength={EMAIL_CODE_LENGTH} pattern="^[0-9]*$" inputMode="numeric" autoComplete="one-time-code" value={value} onChange={onChange} onComplete={onComplete} disabled={disabled}>
      <InputOTPGroup>
        {Array.from({ length: EMAIL_CODE_LENGTH }, (_, i) => <InputOTPSlot key={i} index={i} />)}
      </InputOTPGroup>
    </InputOTP>
  );
}

function EmailField({ id, value, onChange, description }: { id: string; value: string; onChange: (value: string) => void; description?: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Email</FieldLabel>
      <Input id={id} type="email" name="email" autoComplete="email" required placeholder="you@example.com" value={value} onChange={(e) => onChange(e.currentTarget.value)} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function Refused({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

/** Supabase's own refusal of a request it was sent, in words — a limit reached or a password too weak — or null. */
function sayRefusal(error: { status?: number; code?: string; message: string } | null): string | null {
  if (!error) return null;
  if (error.status === 429 || error.code?.startsWith("over_")) return "Too many tries just now. Wait a minute, then try again.";
  if (error.code === "captcha_failed") return "The check that you are a person did not pass. Try again.";
  if (error.code === "weak_password" || /password/i.test(error.message)) return error.message;
  return null;
}

// ── the parts every card shares ────────────────────────────────────────────────────────────────────────────────

/**
 * The last step of a link from a mail: a form that posts the token hash to the callback, submitted the moment it
 * mounts, with its button there for a browser that did not run the script (`routes.ts`: a GET never spends one).
 */
export function ConfirmCard({ app, tokenHash, type, next }: { app: string | null; tokenHash: string; type: string; next: string }) {
  const form = React.useRef<HTMLFormElement>(null);
  const submitted = React.useRef(false);
  const action = `/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;

  React.useEffect(() => {
    // Once, whatever React does with effects in development: a second POST would find the hash already spent.
    if (submitted.current) return;
    submitted.current = true;
    form.current?.requestSubmit();
  }, []);

  return (
    <LoginFrame title={type === "recovery" ? "Opening your account" : "Signing you in"} app={app}>
      <form ref={form} method="post" action={action}>
        <FieldGroup>
          <Button type="submit">
            <Spinner /> Continue
          </Button>
        </FieldGroup>
      </form>
    </LoginFrame>
  );
}

/**
 * Signed in, without the permission that opens `app` (Access.md A6): say so, and offer the ways out — the apps this
 * account may open, or a sign-out to use another. Never a sign-in form, which would only sign the same account in again.
 */
export function DeniedCard({ app, apps }: { app: string; apps?: string }) {
  return (
    <LoginFrame title={`No access to ${app}`} app={app}>
      <FieldGroup>
        <Alert>
          <AlertTitle>This account cannot open {app}</AlertTitle>
          <AlertDescription>
            You are signed in, but your roles do not include {app}. Sign out to use another account, or ask the owner
            for access.
          </AlertDescription>
        </Alert>
        {apps ? (
          <Button asChild variant="outline">
            <a href={apps}>Your apps</a>
          </Button>
        ) : null}
        <form action="/auth/sign-out" method="post">
          <Button type="submit" className="w-full">Sign out</Button>
        </form>
      </FieldGroup>
    </LoginFrame>
  );
}

/** Sign in with a passkey: offered only where the browser can, and it signs in only — it never makes an account. */
export function PasskeyButton({ next }: { next: string }) {
  const available = useWebAuthn();
  const [state, setState] = React.useState<"idle" | "signing">("idle");
  const [error, setError] = React.useState<string | null>(null);

  if (!available) return null;

  async function signIn() {
    setState("signing");
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPasskey();
    if (error) {
      if (!/cancel|abort|NotAllowed/i.test(error.message)) setError("No passkey worked. Use a password, or a link or code.");
      setState("idle");
      return;
    }
    window.location.assign(next);
  }

  return (
    <>
      <FieldSeparator className="my-6">or</FieldSeparator>
      {error ? <div className="mb-4"><Refused title="Passkey sign-in failed">{error}</Refused></div> : null}
      <Button variant="outline" className="w-full" onClick={signIn} disabled={state === "signing"}>
        <KeyRound />
        {state === "signing" ? "Waiting for your device…" : "Sign in with a passkey"}
      </Button>
    </>
  );
}

// ── the forms ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Email and password, to sign in. A full navigation after, so the gate sees the fresh session. */
function PasswordSignIn({ next, forgot }: { next: string; forgot: string }) {
  const challenge = useChallenge();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password || !challenge.ready) return;
    setPending(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
      options: { captchaToken: challenge.token },
    });
    challenge.reset();
    if (error) {
      // A wrong password and an unknown address are one answer from Supabase: no oracle. An address not confirmed yet
      // is answered only to the right password, so it may be said.
      setError(error.code === "email_not_confirmed"
        ? "Confirm your address first: the mail we sent when you made the account has the link."
        : sayRefusal(error) ?? "Those did not work. Check the address and the password.");
      setPending(false);
      return;
    }
    window.location.assign(next);
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup>
        {error ? <Refused title="Not signed in">{error}</Refused> : null}
        <EmailField id="password-email" value={email} onChange={setEmail} />
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
          <FieldDescription>
            <a href={forgot}>Forgot your password?</a>
          </FieldDescription>
        </Field>
        <ChallengeBox challenge={challenge} />
        <Button type="submit" disabled={pending || !challenge.ready}>{pending ? "Signing in…" : "Sign in"}</Button>
      </FieldGroup>
    </form>
  );
}

/**
 * An email link or a code, in one mail: for an address with an account, it signs in; for one without, it makes the
 * account (Access.md: a Member). The answer to asking is the same either way, and the same when the address may not
 * have an account at all; the code then signs in on this page, the link on whichever device opens it.
 */
function EmailLinkOrCode({ next }: { next: string }) {
  const challenge = useChallenge();
  const [email, setEmail] = React.useState("");
  const [step, setStep] = React.useState<"address" | "code">("address");
  const [code, setCode] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !challenge.ready) return;
    setPending(true);
    setError(null);
    try {
      const { error } = await supabaseBrowser().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: callback(next), shouldCreateUser: true, captchaToken: challenge.token },
      });
      // Only a limit or the challenge is said; anything else — an address that may not have an account — is not.
      const refusal = sayRefusal(error);
      if (refusal) setError(refusal);
      else setStep("code");
    } catch {
      setError("Nothing reached the sign-in server. Check the connection and try again.");
    } finally {
      challenge.reset();
      setPending(false);
    }
  }

  async function verify(value: string) {
    setPending(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.verifyOtp({ email: email.trim().toLowerCase(), token: value, type: "email" });
    setCode("");
    if (error) {
      setError("That code did not work. It may have expired, or a newer mail has one that replaced it.");
      setPending(false);
      return;
    }
    window.location.assign(next);
  }

  if (step === "code") {
    return (
      <FieldGroup>
        <Alert>
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>
            If <strong>{email.trim().toLowerCase()}</strong> can sign in here, a mail is on its way with a link and a
            code. Open the link on this device, or type the code here.
          </AlertDescription>
        </Alert>
        {error ? <Refused title="Not signed in">{error}</Refused> : null}
        <Field>
          <FieldLabel htmlFor="email-code">The {EMAIL_CODE_LENGTH}-digit code from the mail</FieldLabel>
          <EmailCode id="email-code" value={code} onChange={setCode} onComplete={verify} disabled={pending} />
        </Field>
        <Button disabled={pending || code.length < EMAIL_CODE_LENGTH} onClick={() => void verify(code)}>{pending ? "Checking…" : "Continue"}</Button>
        <Button variant="ghost" onClick={() => { setStep("address"); setError(null); }}>Use a different address</Button>
      </FieldGroup>
    );
  }

  return (
    <form onSubmit={send}>
      <FieldGroup>
        {error ? <Refused title="Nothing was sent">{error}</Refused> : null}
        <EmailField id="link-email" value={email} onChange={setEmail} description="A link and a code, by email. New here? This makes your account." />
        <ChallengeBox challenge={challenge} />
        <Button type="submit" disabled={pending || !challenge.ready}>{pending ? "Sending…" : "Send the link and code"}</Button>
      </FieldGroup>
    </form>
  );
}

/** Email and a password, to make an account: one mail to confirm the address. Eight characters at least. */
function PasswordSignUp({ next, signIn }: { next: string; signIn: string }) {
  const challenge = useChallenge();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !challenge.ready) return;
    if (password.length < 8) {
      setError("Use at least eight characters.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { data, error } = await supabaseBrowser().auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: callback(next), captchaToken: challenge.token },
      });
      const refusal = sayRefusal(error);
      if (refusal) setError(refusal);
      // A server that confirms no addresses (a local stack) signs the account straight in.
      else if (data.session) window.location.assign(next);
      else setSent(true);
    } catch {
      setError("Nothing reached the sign-in server. Check the connection and try again.");
    } finally {
      challenge.reset();
      setPending(false);
    }
  }

  if (sent) {
    return (
      <FieldGroup>
        <Alert>
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>
            If <strong>{email.trim().toLowerCase()}</strong> can make an account here, a mail is on its way with a link to
            confirm it. Already have one? <a href={signIn}>Sign in</a>.
          </AlertDescription>
        </Alert>
        <Button variant="ghost" onClick={() => setSent(false)}>Use a different address</Button>
      </FieldGroup>
    );
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup>
        {error ? <Refused title="No account made">{error}</Refused> : null}
        <EmailField id="sign-up-email" value={email} onChange={setEmail} />
        <Field>
          <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
          <Input id="sign-up-password" type="password" name="new-password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
          <FieldDescription>Eight characters or more.</FieldDescription>
        </Field>
        <ChallengeBox challenge={challenge} />
        <Button type="submit" disabled={pending || !challenge.ready}>{pending ? "Making it…" : "Make the account"}</Button>
      </FieldGroup>
    </form>
  );
}

// ── the cards ──────────────────────────────────────────────────────────────────────────────────────────────────

function SignInInner() {
  const params = useSearchParams();
  const { raw, next, app } = useNext();
  if (!next) return null;

  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  // Arrived by a link from a mail: the callback handed the token hash here rather than spend it on a GET.
  if (tokenHash && type) return <ConfirmCard app={app} tokenHash={tokenHash} type={type} next={next} />;
  // Signed in, but this account cannot open the app the gate guards (Access.md A6).
  if (params.get("denied")) return <DeniedCard app={app ?? "this app"} apps="/" />;
  // Signed in on one factor, holding a permission that needs two (Access.md A12): the code, then on.
  if (params.get("second")) return <SecondFactorCard app={app ?? "the admin"} next={next} />;
  if (!supabaseEnv()) return <NoKeysCard app={app} next={next} />;

  return (
    <LoginFrame title="Sign in" app={app}>
      {params.get("error") === "link" ? (
        <div className="mb-6">
          <Refused title="That link did not work">It may have been used already, or expired. Ask for another.</Refused>
        </div>
      ) : null}
      <Tabs defaultValue="password">
        <TabsList className="w-full">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="email">Email link or code</TabsTrigger>
        </TabsList>
        <TabsContent value="password" className="mt-6">
          <PasswordSignIn next={next} forgot={withNext("/forgot", raw)} />
        </TabsContent>
        <TabsContent value="email" className="mt-6">
          <EmailLinkOrCode next={next} />
        </TabsContent>
      </Tabs>
      <PasskeyButton next={next} />
      <FieldSeparator className="my-6">new here?</FieldSeparator>
      <Button asChild variant="outline" className="w-full">
        <a href={withNext("/sign-up", raw)}>Make an account</a>
      </Button>
    </LoginFrame>
  );
}

function SignUpInner() {
  const { raw, next, app } = useNext();
  if (!next) return null;
  if (!supabaseEnv()) return <NoKeysCard app={app} next={next} />;
  const signIn = withNext("/sign-in", raw);
  return (
    <LoginFrame title="Make an account" app={app}>
      <Tabs defaultValue="password">
        <TabsList className="w-full">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="email">Email link or code</TabsTrigger>
        </TabsList>
        <TabsContent value="password" className="mt-6">
          <PasswordSignUp next={next} signIn={signIn} />
        </TabsContent>
        <TabsContent value="email" className="mt-6">
          <EmailLinkOrCode next={next} />
        </TabsContent>
      </Tabs>
      {/* What is kept (his wording, 2026-10-08). */}
      <Text role="caption" className="mt-6">
        We keep your email address and when you sign in, so you can sign in again. Delete your account any time from your
        account page.
      </Text>
      <FieldSeparator className="my-6">have an account?</FieldSeparator>
      <Button asChild variant="outline" className="w-full">
        <a href={signIn}>Sign in</a>
      </Button>
    </LoginFrame>
  );
}

/**
 * A forgotten password: a mail with a link that signs in to the page setting a new one (`/reset`). Answered the same
 * whether the address has an account or not.
 */
function ForgotInner() {
  const { raw, next, app } = useNext();
  const challenge = useChallenge();
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  if (!next) return null;
  if (!supabaseEnv()) return <NoKeysCard app={app} next={next} />;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !challenge.ready || !next) return;
    setPending(true);
    setError(null);
    try {
      const reset = `${window.location.origin}/reset?next=${encodeURIComponent(next)}`;
      const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: callback(reset),
        captchaToken: challenge.token,
      });
      const refusal = sayRefusal(error);
      if (refusal) setError(refusal);
      else setSent(true);
    } catch {
      setError("Nothing reached the sign-in server. Check the connection and try again.");
    } finally {
      challenge.reset();
      setPending(false);
    }
  }

  return (
    <LoginFrame title="Forgot your password?" app={app}>
      {sent ? (
        <FieldGroup>
          <Alert>
            <AlertTitle>Check your inbox</AlertTitle>
            <AlertDescription>
              If <strong>{email.trim().toLowerCase()}</strong> has an account here, a mail is on its way with a link to set
              a new password.
            </AlertDescription>
          </Alert>
          <Button asChild variant="outline">
            <a href={withNext("/sign-in", raw)}>Back to sign in</a>
          </Button>
        </FieldGroup>
      ) : (
        <form onSubmit={send}>
          <FieldGroup>
            {error ? <Refused title="Nothing was sent">{error}</Refused> : null}
            <EmailField id="forgot-email" value={email} onChange={setEmail} description="A link to set a new one, by email." />
            <ChallengeBox challenge={challenge} />
            <Button type="submit" disabled={pending || !challenge.ready}>{pending ? "Sending…" : "Send the link"}</Button>
            <Button asChild variant="ghost">
              <a href={withNext("/sign-in", raw)}>Back to sign in</a>
            </Button>
          </FieldGroup>
        </form>
      )}
    </LoginFrame>
  );
}

/**
 * The new password, signed in by the link from the mail. An account with an authenticator gives its code first:
 * Supabase takes no new password on one factor once one is added (Access.md A12).
 */
function ResetInner() {
  const { next, app } = useNext();
  const secondFactor = useSecondFactor();
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  if (!next) return null;
  if (!supabaseEnv()) return <NoKeysCard app={app} next={next} />;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use at least eight characters.");
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    window.location.assign(next!);
  }

  return (
    <LoginFrame title="A new password" app={app}>
      {secondFactor.status === "checking" ? (
        <Text role="body" tone="muted">Opening your account…</Text>
      ) : secondFactor.status === "signed-out" ? (
        <FieldGroup>
          <Refused title="That link has ended">Ask for another: links work once, for an hour.</Refused>
          <Button asChild variant="outline">
            <a href="/forgot">Send another link</a>
          </Button>
        </FieldGroup>
      ) : secondFactor.locked ? (
        <FieldGroup>
          <Text role="body">Your account has an authenticator app: its code first, then the new password.</Text>
          <CodeForm id="reset-code" onProven={secondFactor.refresh} />
        </FieldGroup>
      ) : (
        <form onSubmit={save}>
          <FieldGroup>
            {error ? <Refused title="Not set">{error}</Refused> : null}
            <Field>
              <FieldLabel htmlFor="reset-password">New password</FieldLabel>
              <Input id="reset-password" type="password" name="new-password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
              <FieldDescription>Eight characters or more.</FieldDescription>
            </Field>
            <Button type="submit" disabled={pending}>{pending ? "Setting it…" : "Set the password"}</Button>
          </FieldGroup>
        </form>
      )}
    </LoginFrame>
  );
}

// `useSearchParams` needs a Suspense boundary, or the whole route opts out of static rendering.
export function SignInCard() {
  return <React.Suspense fallback={null}><SignInInner /></React.Suspense>;
}

export function SignUpCard() {
  return <React.Suspense fallback={null}><SignUpInner /></React.Suspense>;
}

export function ForgotCard() {
  return <React.Suspense fallback={null}><ForgotInner /></React.Suspense>;
}

export function ResetCard() {
  return <React.Suspense fallback={null}><ResetInner /></React.Suspense>;
}
