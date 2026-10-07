"use client";

import * as React from "react";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@no-origins/ui/components/alert-dialog";
import { Button } from "@no-origins/ui/components/button";

import type { Done } from "@/app/access/actions";
import { useRefuse } from "@/components/admin-pages";

/**
 * A change's answer, for the access pages: run it in a transition, and when the database refuses, show its sentence
 * under the page's name (admin-pages.tsx), where every record of the list can reach it.
 */
export function useChange() {
  const refuse = useRefuse();
  const [pending, start] = React.useTransition();
  const run = React.useCallback((change: () => Promise<Done>, then?: () => void) => {
    refuse(null);
    start(async () => {
      const done = await change();
      if (done.ok) then?.();
      else refuse(done.message);
    });
  }, [refuse]);
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
