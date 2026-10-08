"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@no-origins/ui/components/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@no-origins/ui/components/input-otp";
import { Text } from "@no-origins/ui/components/text";

import { supabaseBrowser } from "./client";
import { supabaseEnv } from "./env";

/**
 * The second factor (Access.md A12): an authenticator app's six-digit code, which takes a session from `aal1` to
 * `aal2`. The account's side of it — adding an authenticator, giving a code, removing one — as a hook, two forms and
 * the frames they are shown in: two dialogs for the admin's Settings and a card for the sign-in page's code step, which
 * the gate sends a one-factor session to when it holds an `admin.*` permission. All of it built from the design system,
 * so the auth app (`auth.no-origins.com`, Admin.md §8.4) takes it unchanged.
 *
 * Supabase's own rules, proven on the local stack on 2026-10-08: once an authenticator is verified, adding another or
 * removing one needs `aal2`, so a session that has not given a code is asked for one first (`locked`). A passkey
 * sign-in is `aal1` to Supabase (its `amr` says `passkey`): it opens the admin (his, A12) but is asked for a code to
 * change the authenticators.
 */

export type Authenticator = { id: string; name: string; createdAt: string };

export type SecondFactor = {
  /** `unavailable` when the server has authenticator apps off (`[auth.mfa.totp]`); `signed-out` with no session. */
  status: "checking" | "ready" | "unavailable" | "signed-out";
  authenticators: Authenticator[];
  /** This session has given a code (`aal2`). */
  proven: boolean;
  /** Changing the authenticators needs a code first: one is verified and this session has not given it. */
  locked: boolean;
  refresh: () => Promise<void>;
};

const MISMATCH = "That code did not match. Codes change every 30 seconds: try the one showing now.";

export function useSecondFactor(): SecondFactor {
  const [state, setState] = React.useState<Omit<SecondFactor, "refresh">>({ status: "checking", authenticators: [], proven: false, locked: false });

  const refresh = React.useCallback(async () => {
    // A development server with no keys has no account to ask about.
    if (!supabaseEnv()) {
      setState({ status: "signed-out", authenticators: [], proven: false, locked: false });
      return;
    }
    const auth = supabaseBrowser().auth;
    // Nobody signed in is not "authenticator apps are off": say which.
    if (!(await auth.getSession()).data.session) {
      setState({ status: "signed-out", authenticators: [], proven: false, locked: false });
      return;
    }
    const mfa = auth.mfa;
    const [factors, level] = await Promise.all([mfa.listFactors(), mfa.getAuthenticatorAssuranceLevel()]);
    if (factors.error || level.error) {
      setState({ status: "unavailable", authenticators: [], proven: false, locked: false });
      return;
    }
    const authenticators = factors.data.totp.map((f) => ({ id: f.id, name: f.friendly_name || "Authenticator", createdAt: f.created_at }));
    const proven = level.data.currentLevel === "aal2";
    setState({ status: "ready", authenticators, proven, locked: authenticators.length > 0 && !proven });
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}

/** Six digits, in the system's circles. Filled, it submits itself. */
function CodeInput({ id, value, onChange, onComplete, disabled }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <InputOTP id={id} maxLength={6} pattern="^[0-9]*$" inputMode="numeric" autoComplete="one-time-code" value={value} onChange={onChange} onComplete={onComplete} disabled={disabled}>
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, i) => <InputOTPSlot key={i} index={i} />)}
      </InputOTPGroup>
    </InputOTP>
  );
}

/** Give a code from an authenticator already added: the session becomes `aal2`. Null when it took. */
async function prove(code: string): Promise<string | null> {
  const mfa = supabaseBrowser().auth.mfa;
  const factors = await mfa.listFactors();
  if (factors.error) return factors.error.message;
  if (!factors.data.totp.length) return "This account has no authenticator app yet: add one in Settings, then use its code.";
  // Any verified authenticator's code will do; Supabase checks it against the one named, so try each.
  for (const factor of factors.data.totp) {
    const { error } = await mfa.challengeAndVerify({ factorId: factor.id, code });
    if (!error) return null;
  }
  return MISMATCH;
}

/** A code from an authenticator already added; `onProven` once the session is `aal2`. */
export function CodeForm({ id = "second-factor-code", label = "The six-digit code in your authenticator app", action = "Continue", onProven }: {
  id?: string;
  label?: string;
  action?: string;
  onProven: () => void | Promise<void>;
}) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const submit = (value: string) =>
    start(async () => {
      setError(null);
      const failed = await prove(value);
      setCode("");
      if (failed) setError(failed);
      else await onProven();
    });
  return (
    <FieldGroup>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <CodeInput id={id} value={code} onChange={setCode} onComplete={submit} disabled={pending} />
      </Field>
      <Button disabled={pending || code.length < 6} onClick={() => submit(code)}>{pending ? "Checking…" : action}</Button>
    </FieldGroup>
  );
}

type Enrolment = { factorId: string; qr: string; secret: string };

/**
 * Adding an authenticator: a code from one already added first, when the session has not given one; then a name, the
 * QR code (and its key, for a password manager that takes it typed), and a code from it to prove it took. Unmounted
 * half way — a dialog closed, a page left — it removes the half-added authenticator, so nothing is left unverified.
 */
export function AuthenticatorFlow({ secondFactor, onDone }: { secondFactor: SecondFactor; onDone: () => void | Promise<void> }) {
  const [step, setStep] = React.useState<"prove" | "name" | "scan">(secondFactor.locked ? "prove" : "name");
  const [name, setName] = React.useState(secondFactor.authenticators.length ? "Password manager" : "Phone");
  const [code, setCode] = React.useState("");
  const [enrolment, setEnrolment] = React.useState<Enrolment | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const taken = new Set(secondFactor.authenticators.map((a) => a.name.toLowerCase())).has(name.trim().toLowerCase());

  // The half-added one goes when the flow does.
  const half = React.useRef<string | null>(null);
  React.useEffect(() => () => {
    if (half.current) void supabaseBrowser().auth.mfa.unenroll({ factorId: half.current });
  }, []);

  const begin = () =>
    start(async () => {
      setError(null);
      const mfa = supabaseBrowser().auth.mfa;
      // An authenticator added and never proven (a closed tab) would block its name: clear those first.
      const all = await mfa.listFactors();
      for (const f of all.data?.all ?? []) {
        if (f.factor_type === "totp" && f.status === "unverified") await mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await mfa.enroll({ factorType: "totp", friendlyName: name.trim() });
      if (error || !data) {
        setError(error?.message || "The authenticator could not be added.");
        return;
      }
      half.current = data.id;
      setEnrolment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
      setStep("scan");
    });

  const confirm = (value: string) =>
    start(async () => {
      if (!enrolment) return;
      setError(null);
      const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId: enrolment.factorId, code: value });
      setCode("");
      if (error) {
        setError(MISMATCH);
        return;
      }
      half.current = null;
      await onDone();
    });

  if (step === "prove") {
    return (
      <FieldGroup>
        <Text role="body" tone="muted">First, a code from an authenticator you already have: adding one needs it.</Text>
        <CodeForm id="second-factor-prove" label="The six-digit code" onProven={() => setStep("name")} />
      </FieldGroup>
    );
  }

  return (
    <FieldGroup>
      <Text role="body" tone="muted">
        {step === "name"
          ? "An app that shows a six-digit code every 30 seconds: your phone's, or a password manager's."
          : "Scan the code with the app, or type the key into it, then enter the six digits it shows."}
      </Text>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}

      {step === "name" ? (
        <>
          <Field>
            <FieldLabel htmlFor="second-factor-name">Name it</FieldLabel>
            <Input id="second-factor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Phone" disabled={pending} />
            <FieldDescription>So you can tell your authenticators apart in Settings.</FieldDescription>
          </Field>
          <Button disabled={pending || !name.trim() || taken} onClick={begin}>
            {taken ? "That name is taken" : pending ? "Making the code…" : "Show the QR code"}
          </Button>
        </>
      ) : enrolment ? (
        <>
          <div className="flex flex-col items-center gap-3">
            {/* A QR code must be dark on light to scan, in either theme: a white mat, the picture's only. */}
            <div className="rounded-lg bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a data URL Supabase makes; nothing to optimise */}
              <img src={enrolment.qr} alt="QR code to add this account to an authenticator app" className="size-44" />
            </div>
            <Text role="mono" align="center" className="break-all select-all">{enrolment.secret.match(/.{1,4}/g)?.join(" ")}</Text>
          </div>
          <Field>
            <FieldLabel htmlFor="second-factor-confirm">The six-digit code it shows</FieldLabel>
            <CodeInput id="second-factor-confirm" value={code} onChange={setCode} onComplete={confirm} disabled={pending} />
          </Field>
          <Button disabled={pending || code.length < 6} onClick={() => confirm(code)}>{pending ? "Checking…" : "Add it"}</Button>
        </>
      ) : null}
    </FieldGroup>
  );
}

/** Add an authenticator, in a dialog (the admin's Settings). Each opening starts afresh: its body mounts with it. */
export function AddAuthenticatorDialog({ open, onOpenChange, secondFactor, onAdded }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secondFactor: SecondFactor;
  onAdded: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an authenticator</DialogTitle>
          <DialogDescription className="sr-only">An app that shows a six-digit code, for the admin's second factor.</DialogDescription>
        </DialogHeader>
        <AuthenticatorFlow
          secondFactor={secondFactor}
          onDone={async () => {
            await onAdded();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ask for a code before something that needs it (removing an authenticator; later, the gravest actions, A12). `then`
 * runs once the session is `aal2`.
 */
export function CodeDialog({ open, onOpenChange, title, line, then }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  line: string;
  then: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{line}</DialogDescription>
        </DialogHeader>
        <CodeForm
          onProven={async () => {
            await then();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The sign-in page's code step (Access.md A12): the gate sends a one-factor session here when it holds an `admin.*`
 * permission. A code from an authenticator — or, with none yet, adding one — and then on to `next`, by a full
 * navigation so the gate reads the new token. A sign-out is always offered: it may be the wrong account.
 */
export function SecondFactorCard({ app, next }: { app: string; next: string }) {
  const secondFactor = useSecondFactor();
  const go = () => window.location.assign(next);
  // Signed out here — an old link, a session that ended on this step — is the sign-in form's, still going to `next`.
  React.useEffect(() => {
    if (secondFactor.status === "signed-out") window.location.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [secondFactor.status, next]);
  const none = secondFactor.status === "ready" && !secondFactor.authenticators.length;
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{none ? "Add a second factor" : "One more step"}</CardTitle>
        <CardDescription>No Origins · {app}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {secondFactor.status === "checking" || secondFactor.status === "signed-out" ? (
            <Text role="body" tone="muted">{secondFactor.status === "checking" ? "Checking your authenticators…" : "Your session has ended. Taking you to sign in…"}</Text>
          ) : secondFactor.status === "unavailable" ? (
            <Alert>
              <AlertTitle>Authenticator apps are off</AlertTitle>
              <AlertDescription>
                {app} needs a code from an authenticator app, and this server has them switched off. Switch on
                [auth.mfa.totp] in supabase/config.toml, or in the hosted dashboard.
              </AlertDescription>
            </Alert>
          ) : none ? (
            <>
              <Text role="body">{app} asks for a code from an authenticator app once a sign-in. Add one now; add a second later in Settings, so losing one is not losing {app}.</Text>
              <AuthenticatorFlow secondFactor={secondFactor} onDone={go} />
            </>
          ) : (
            <>
              <Text role="body">Enter the code from your authenticator app. {app} asks for it once a sign-in; signing in with a passkey skips it.</Text>
              <CodeForm onProven={go} />
            </>
          )}
          <form action="/auth/sign-out" method="post">
            <Button type="submit" variant="outline" className="w-full">Sign out</Button>
          </form>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
