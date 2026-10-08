"use client";

import * as React from "react";
import { Smartphone, Trash2 } from "lucide-react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Text } from "@no-origins/ui/components/text";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@no-origins/ui/components/alert-dialog";
import { supabaseBrowser } from "@no-origins/auth/client";
import { AddAuthenticatorDialog, CodeDialog, type Authenticator, type SecondFactor } from "@no-origins/auth/second-factor";

import { RecordBox } from "@/components/admin-pages";

const HEAD_COLS = "@min-[600px]:grid-cols-[minmax(0,1fr)_auto]";

/**
 * The second factor's heading on Settings (Access.md A12): what it is, whether this session has given a code, and
 * adding an authenticator. Step 1 of A12's order: nothing asks for the code yet.
 */
export function AuthenticatorsHead({ secondFactor }: { secondFactor: SecondFactor }) {
  const [adding, setAdding] = React.useState(false);
  return (
    <RecordBox className={HEAD_COLS}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <Text role="body" as="span">Authenticator apps</Text>
          {secondFactor.authenticators.length ? (
            <Badge variant={secondFactor.proven ? "secondary" : "outline"}>{secondFactor.proven ? "Code given" : "No code yet this session"}</Badge>
          ) : null}
        </div>
        <Text role="caption" as="span" className="line-clamp-2">
          The second factor: soon the admin asks for a six-digit code once a sign-in. Add two — your phone and a password
          manager — so losing one is not losing the admin.
        </Text>
      </div>
      <Button variant="outline" onClick={() => setAdding(true)} disabled={secondFactor.status !== "ready"}>Add an authenticator</Button>
      <AddAuthenticatorDialog open={adding} onOpenChange={setAdding} secondFactor={secondFactor} onAdded={secondFactor.refresh} />
    </RecordBox>
  );
}

/** One authenticator, a record on the field; removing it asks first, and for a code when the session has not given one. */
export function AuthenticatorRecord({ authenticator, secondFactor }: { authenticator: Authenticator; secondFactor: SecondFactor }) {
  const [asking, setAsking] = React.useState(false);
  const [proving, setProving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const last = secondFactor.authenticators.length === 1;

  const remove = async () => {
    setError(null);
    const { error } = await supabaseBrowser().auth.mfa.unenroll({ factorId: authenticator.id });
    if (error) setError(error.message);
    await secondFactor.refresh();
  };

  return (
    <RecordBox className="flex-row items-center justify-between @min-[600px]:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <Smartphone className="text-muted-foreground size-4 shrink-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Text role="body" as="span" className="truncate">{authenticator.name}</Text>
          <Text role="caption" as="span" className="truncate">{error ?? `Added ${new Date(authenticator.createdAt).toLocaleDateString()}`}</Text>
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${authenticator.name}`} onClick={() => setAsking(true)}>
        <Trash2 />
      </Button>
      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {authenticator.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {last
                ? "It is your only authenticator: once the admin asks for a code, you would add a new one at your next sign-in."
                : "Its codes stop working at once. Your other authenticator still opens the admin."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (secondFactor.locked) setProving(true);
                else void remove();
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CodeDialog
        open={proving}
        onOpenChange={setProving}
        title={`Remove ${authenticator.name}`}
        line="Removing an authenticator needs a code from one first."
        then={remove}
      />
    </RecordBox>
  );
}
