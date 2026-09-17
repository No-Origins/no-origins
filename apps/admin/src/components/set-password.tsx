"use client";
import { useState } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { Button } from "@no-origins/ui/components/button";
import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Set (or change) the account password, while signed in.
 *
 * This is the only place a password is ever created. The membership path is the magic link — you get in with a
 * link first, then set a password here if you want the faster door next time. `updateUser` runs against the
 * live session, so there is no address to type and no oracle to leak.
 */
export function SetPassword() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use at least eight characters.");
      return;
    }
    setState("saving");
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setState("idle");
      return;
    }
    setPassword("");
    setState("saved");
  }

  return (
    <form onSubmit={save}>
      <FieldGroup>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {state === "saved" ? (
          <Alert>
            <AlertTitle>Password set</AlertTitle>
            <AlertDescription>You can now sign in with your email and password.</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <Input
            id="new-password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <FieldDescription>At least eight characters.</FieldDescription>
        </Field>
        <Button type="submit" disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Set password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
