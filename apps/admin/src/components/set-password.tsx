"use client";
import { useState } from "react";
import { Button } from "@no-origins/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@no-origins/ui/components/input-group";
import { Text } from "@no-origins/ui/components/text";
import { supabaseBrowser } from "@no-origins/auth/client";

import { RecordBox } from "@/components/admin-pages";

const COLS = "@min-[600px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]";

/**
 * Set (or change) the account password, while signed in — a record on the Settings page's field.
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

  const note = error
    ? `Could not save: ${error}`
    : state === "saved"
      ? "Set. You can now sign in with your email and password."
      : "Optional: a faster door than the magic link. Eight characters or more.";

  return (
    <form onSubmit={save} className="size-full">
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
    </form>
  );
}
