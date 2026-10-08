"use client";

import * as React from "react";

import { Button } from "@no-origins/ui/components/button";
import { Text } from "@no-origins/ui/components/text";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@no-origins/ui/components/alert-dialog";
import { supabaseBrowser } from "@no-origins/auth/client";
import { CodeDialog, type SecondFactor } from "@no-origins/auth/second-factor";

import { RecordBox } from "@/components/auth-pages";

const COLS = "@min-[600px]:grid-cols-[minmax(0,1fr)_auto]";

/**
 * Deleting one's own account (Access.md A2, a self right; Admin.md §8.4 step 5, his: "a confirming dialog, and a fresh
 * code first when the account has an authenticator"). The database decides (`noo_delete_own_account`): never the
 * Owner's, and with an authenticator only after a code from the last five minutes, refusing with `NOAAL` — answered
 * here by asking for the code and trying again. Gone, the session is cleared on this device and the sign-in shows.
 */
export function DeleteAccount({ secondFactor, owner }: { secondFactor: SecondFactor; owner: boolean }) {
  const [asking, setAsking] = React.useState(false);
  const [proving, setProving] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const remove = async () => {
    setPending(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.rpc("noo_delete_own_account");
    if (error) {
      setPending(false);
      if (error.code === "NOAAL") setProving(true);
      else setError(error.message);
      return;
    }
    // The account and its sessions are gone on the server; this clears the cookie here without asking it again.
    await supabase.auth.signOut({ scope: "local" });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full navigation, so the gate sees the cookie gone
    window.location.assign("/sign-in");
  };

  const note = owner
    ? "The Owner's account is never deleted."
    : error ?? "Your address, your roles and your sign-ins go, at once. The record of changes to who may do what stays.";

  return (
    <RecordBox className={COLS}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Text role="body" as="span">Delete your account</Text>
        <Text role="caption" as="span" tone={error ? "foreground" : "muted"} className="line-clamp-2" aria-live="polite">{note}</Text>
      </div>
      <Button variant="destructive" disabled={owner || pending} onClick={() => setAsking(true)}>
        {pending ? "Deleting…" : "Delete account"}
      </Button>
      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              It cannot be undone. You are signed out of every app of No Origins, and your address can make a new account
              later, with none of this one&apos;s roles.
              {secondFactor.authenticators.length ? " Your authenticator's code comes next." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (secondFactor.authenticators.length) setProving(true);
                else void remove();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CodeDialog
        open={proving}
        onOpenChange={setProving}
        title="A code, to confirm it's you"
        line="Deleting your account needs a code from your authenticator from the last five minutes."
        then={remove}
      />
    </RecordBox>
  );
}
