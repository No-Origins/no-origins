"use client";
import { useState } from "react";
import { Button } from "@no-origins/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@no-origins/ui/components/input-group";
import { Text } from "@no-origins/ui/components/text";
import { supabaseBrowser } from "@no-origins/auth/client";
import { CodeDialog, type SecondFactor } from "@no-origins/auth/second-factor";

import { RecordBox } from "@/components/auth-pages";

const COLS = "@min-[600px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]";

/**
 * Set (or change) the account's password, while signed in — a record on the account page's field. `updateUser` runs
 * against the live session, so there is no address to type and no oracle to leak. An account with an authenticator
 * gives its code first: Supabase takes no new password on one factor once one is added (Access.md A12).
 */
export function SetPassword({ secondFactor }: { secondFactor: SecondFactor }) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [proving, setProving] = useState(false);

  async function save() {
    setState("saving");
    setError(null);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setState("idle");
      return;
    }
    setPassword("");
    setState("saved");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use at least eight characters.");
      return;
    }
    if (secondFactor.locked) setProving(true);
    else void save();
  }

  const note = error
    ? `Could not save: ${error}`
    : state === "saved"
      ? "Set. You can now sign in with your email and password."
      : "Sign in with your address and this, no mail needed. Eight characters or more.";

  return (
    <form onSubmit={submit} className="size-full">
      <RecordBox className={COLS}>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Text role="body" as="span">Password</Text>
          <Text role="caption" as="span" tone={error ? "foreground" : "muted"} className="line-clamp-2" aria-live="polite">{note}</Text>
        </div>
        <InputGroup>
          <InputGroupAddon><InputGroupText>New</InputGroupText></InputGroupAddon>
          <InputGroupInput
            aria-label="New password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
        </InputGroup>
        <Button type="submit" disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Set password"}
        </Button>
      </RecordBox>
      <CodeDialog
        open={proving}
        onOpenChange={setProving}
        title="A code, then the password"
        line="Your account has an authenticator app: a new password needs its code first."
        then={async () => {
          await secondFactor.refresh();
          await save();
        }}
      />
    </form>
  );
}
