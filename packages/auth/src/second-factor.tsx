"use client";

import * as React from "react";

import { Alert, AlertDescription } from "@no-origins/ui/components/alert";
import { Button } from "@no-origins/ui/components/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@no-origins/ui/components/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@no-origins/ui/components/input-otp";
import { Text } from "@no-origins/ui/components/text";

import { supabaseBrowser } from "./client";

/**
 * The second factor (Access.md A12): an authenticator app's six-digit code, which takes a session from `aal1` to
 * `aal2`. This is the account's side of it — adding an authenticator, giving a code, removing one — as a hook and two
 * dialogs built from the design system, so the admin's Settings shows them today and the auth app
 * (`auth.no-origins.com`, Admin.md §8.4) takes them unchanged. Requiring the code is not here: that is the gate's,
 * `shown()`'s and the database's (A12, step 3).
 *
 * Supabase's own rules, proven on the local stack on 2026-10-08: once an authenticator is verified, adding another or
 * removing one needs `aal2`, so a session that has not given a code is asked for one first (`locked`). A passkey
 * sign-in is `aal1` to Supabase (its `amr` says `passkey`), so it is asked too.
 */

export type Authenticator = { id: string; name: string; createdAt: string };

export type SecondFactor = {
  /** `unavailable` when the server has authenticator apps off (`[auth.mfa.totp]`), or nobody is signed in. */
  status: "checking" | "ready" | "unavailable";
  authenticators: Authenticator[];
  /** This session has given a code (`aal2`). */
  proven: boolean;
  /** Changing the authenticators needs a code first: one is verified and this session has not given it. */
  locked: boolean;
  refresh: () => Promise<void>;
};

const message = (error: { message: string } | null | undefined, fallback: string) => error?.message || fallback;

export function useSecondFactor(): SecondFactor {
  const [state, setState] = React.useState<Omit<SecondFactor, "refresh">>({ status: "checking", authenticators: [], proven: false, locked: false });

  const refresh = React.useCallback(async () => {
    const mfa = supabaseBrowser().auth.mfa;
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

/** Give a code from an authenticator already added: the session becomes `aal2`. */
async function prove(code: string): Promise<string | null> {
  const mfa = supabaseBrowser().auth.mfa;
  const factors = await mfa.listFactors();
  if (factors.error) return factors.error.message;
  // Any verified authenticator's code will do; Supabase checks it against the one named, so try each.
  for (const factor of factors.data.totp) {
    const { error } = await mfa.challengeAndVerify({ factorId: factor.id, code });
    if (!error) return null;
  }
  return "That code did not match. Codes change every 30 seconds: try the one showing now.";
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
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  // A fresh start each time it opens — its owner opens it by `open`, so Radix's onOpenChange never says so.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCode("");
      setError(null);
    }
  }
  const submit = (value: string) =>
    start(async () => {
      setError(null);
      const failed = await prove(value);
      if (failed) {
        setError(failed);
        setCode("");
        return;
      }
      await then();
      onOpenChange(false);
    });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{line}</DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <Field>
          <FieldLabel htmlFor="second-factor-code">The six-digit code in your authenticator app</FieldLabel>
          <CodeInput id="second-factor-code" value={code} onChange={setCode} onComplete={submit} disabled={pending} />
        </Field>
        <DialogFooter>
          <Button disabled={pending || code.length < 6} onClick={() => submit(code)}>{pending ? "Checking…" : "Continue"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Enrolment = { factorId: string; qr: string; secret: string };

/**
 * Add an authenticator: a name, then the QR code (and its key, for a password manager that takes it typed), then a
 * code from it to prove it took. Asks for a code from one already added first, when the session has not given one.
 * Closing it before the last step removes the half-added authenticator, so nothing is left unverified.
 */
export function AddAuthenticatorDialog({ open, onOpenChange, secondFactor, onAdded }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secondFactor: SecondFactor;
  onAdded: () => void | Promise<void>;
}) {
  const [step, setStep] = React.useState<"prove" | "name" | "scan">("name");
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [enrolment, setEnrolment] = React.useState<Enrolment | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const taken = new Set(secondFactor.authenticators.map((a) => a.name.toLowerCase()));
  // A fresh start each time it opens: a code first when this session has not given one, then a name.
  const [wasOpen, setWasOpen] = React.useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(secondFactor.locked ? "prove" : "name");
      setName(secondFactor.authenticators.length ? "Password manager" : "Phone");
      setCode("");
      setError(null);
    }
  }

  const abandon = async () => {
    if (enrolment) await supabaseBrowser().auth.mfa.unenroll({ factorId: enrolment.factorId });
    setEnrolment(null);
  };

  const proveFirst = (value: string) =>
    start(async () => {
      setError(null);
      const failed = await prove(value);
      setCode("");
      if (failed) setError(failed);
      else setStep("name");
    });

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
        setError(message(error, "The authenticator could not be added."));
        return;
      }
      setEnrolment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
      setStep("scan");
    });

  const confirm = (value: string) =>
    start(async () => {
      if (!enrolment) return;
      setError(null);
      const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId: enrolment.factorId, code: value });
      if (error) {
        setError("That code did not match. Codes change every 30 seconds: try the one showing now.");
        setCode("");
        return;
      }
      setEnrolment(null);
      await onAdded();
      onOpenChange(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) void abandon();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an authenticator</DialogTitle>
          <DialogDescription>
            {step === "prove"
              ? "First, a code from an authenticator you already have: adding one needs it."
              : step === "name"
                ? "An app that shows a six-digit code every 30 seconds: your phone's, or a password manager's."
                : "Scan the code with the app, or type the key into it, then enter the six digits it shows."}
          </DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}

        {step === "prove" ? (
          <Field>
            <FieldLabel htmlFor="second-factor-prove">The six-digit code</FieldLabel>
            <CodeInput id="second-factor-prove" value={code} onChange={setCode} onComplete={proveFirst} disabled={pending} />
          </Field>
        ) : null}

        {step === "name" ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="second-factor-name">Name it</FieldLabel>
              <Input id="second-factor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Phone" disabled={pending} />
              <FieldDescription>So you can tell your authenticators apart in Settings.</FieldDescription>
            </Field>
          </FieldGroup>
        ) : null}

        {step === "scan" && enrolment ? (
          <FieldGroup>
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
          </FieldGroup>
        ) : null}

        <DialogFooter>
          {step === "prove" ? (
            <Button disabled={pending || code.length < 6} onClick={() => proveFirst(code)}>{pending ? "Checking…" : "Continue"}</Button>
          ) : step === "name" ? (
            <Button disabled={pending || !name.trim() || taken.has(name.trim().toLowerCase())} onClick={begin}>
              {taken.has(name.trim().toLowerCase()) ? "That name is taken" : pending ? "Making the code…" : "Show the QR code"}
            </Button>
          ) : (
            <Button disabled={pending || code.length < 6} onClick={() => confirm(code)}>{pending ? "Checking…" : "Add it"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
