"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";

import type { Done } from "@/app/access/actions";

/**
 * A change's answer, for the access pages: run it in a transition, and keep the database's sentence when it refuses.
 */
export function useChange() {
  const [pending, start] = React.useTransition();
  const [refusal, setRefusal] = React.useState<string | null>(null);
  const run = React.useCallback((change: () => Promise<Done>, then?: () => void) => {
    setRefusal(null);
    start(async () => {
      const done = await change();
      if (done.ok) then?.();
      else setRefusal(done.message);
    });
  }, []);
  return { pending, refusal, run };
}

export function Refusal({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertTitle>Not done</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
