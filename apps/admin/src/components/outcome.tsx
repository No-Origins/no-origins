"use client";

import * as React from "react";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@no-origins/ui/components/alert-dialog";
import { Button } from "@no-origins/ui/components/button";

import type { Done } from "@/app/access/actions";
import { useRefuse, useStepUp } from "@/components/admin-pages";

/**
 * A change's answer, for the access pages: run it in a transition, and when the database refuses, show its sentence
 * under the page's name (admin-pages.tsx), where every record of the list can reach it. When it asks for a fresh code
 * (Access.md A12, the gravest changes), ask for one and run the same change again.
 */
export function useChange() {
  const refuse = useRefuse();
  const stepUp = useStepUp();
  const [pending, start] = React.useTransition();
  const run = React.useCallback((change: () => Promise<Done>, then?: () => void) => {
    const attempt = () => {
      refuse(null);
      start(async () => {
        const done = await change();
        if (done.ok) then?.();
        else if (done.secondFactor) stepUp(attempt);
        else refuse(done.message);
      });
    };
    attempt();
  }, [refuse, stepUp]);
  return { pending, run };
}

/** A change that asks first. */
export function Confirm({ label, title, line, destructive, pending, onConfirm }: {
  label: string;
  title: string;
  line: string;
  destructive?: boolean;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant={destructive ? "destructive" : "outline"} disabled={pending}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{line}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} onClick={onConfirm}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
