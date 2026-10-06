"use client";

import * as React from "react";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@no-origins/ui/components/alert-dialog";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@no-origins/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@no-origins/ui/components/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@no-origins/ui/components/table";
import { Text } from "@no-origins/ui/components/text";

import { endSessions, giveRole, removeAccount, takeRole } from "@/app/access/actions";
import { Refusal, useChange } from "@/components/outcome";

export type PersonRow = {
  id: string;
  email: string;
  name: string | null;
  kind: "person" | "agent";
  joined: string;
  lastSignIn: string;
  roles: { id: string; name: string; builtIn: "owner" | "member" | null }[];
};

/**
 * Everyone and every agent (Access.md A7, People): their roles, when they joined and last signed in, and what the
 * signed-in person may do to them — give and take roles (`admin.people.assign`), end their sessions and remove them
 * (`admin.people.remove`). The Owner and oneself have no actions here: the database refuses both anyway.
 */
export function PeopleTable({ people, roles, me, mayAssign, mayRemove }: {
  people: PersonRow[];
  roles: { id: string; name: string }[];
  me: string | null;
  mayAssign: boolean;
  mayRemove: boolean;
}) {
  const { pending, refusal, run } = useChange();
  return (
    <div className="flex flex-col gap-4">
      <Refusal message={refusal} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Who</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last signed in</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => {
            const owner = person.roles.some((r) => r.builtIn === "owner");
            const actable = !owner && person.id !== me;
            return (
              <TableRow key={person.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Text role="body" as="span">{person.name ?? person.email}</Text>
                    <div className="flex items-center gap-2">
                      {person.name ? <Text role="caption" as="span">{person.email}</Text> : null}
                      {person.kind === "agent" ? <Badge variant="secondary">Agent</Badge> : null}
                      {person.id === me ? <Badge variant="outline">You</Badge> : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {person.roles.length ? person.roles.map((r) => <Badge key={r.id} variant={r.builtIn === "owner" ? "default" : "outline"}>{r.name}</Badge>) : <Text role="caption" as="span">None</Text>}
                  </div>
                </TableCell>
                <TableCell><Text role="caption" as="span">{person.joined}</Text></TableCell>
                <TableCell><Text role="caption" as="span">{person.lastSignIn}</Text></TableCell>
                <TableCell className="text-right">
                  {actable ? (
                    <div className="flex justify-end gap-2">
                      {mayAssign ? <RolesDialog person={person} roles={roles} pending={pending} run={run} /> : null}
                      {mayRemove ? (
                        <>
                          <Confirm
                            label="End sessions"
                            title={`End ${person.name ?? person.email}'s sessions?`}
                            line="They are signed out of every app at once and must sign in again."
                            pending={pending}
                            onConfirm={() => run(() => endSessions(person.id))}
                          />
                          <Confirm
                            label="Remove"
                            destructive
                            title={`Remove ${person.name ?? person.email}?`}
                            line="Their account and roles go. The audit log keeps what they did."
                            pending={pending}
                            onConfirm={() => run(() => removeAccount(person.id))}
                          />
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function RolesDialog({ person, roles, pending, run }: {
  person: PersonRow;
  roles: { id: string; name: string }[];
  pending: boolean;
  run: ReturnType<typeof useChange>["run"];
}) {
  const held = new Set(person.roles.map((r) => r.id));
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="xs" variant="outline">Roles</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person.name ?? person.email}</DialogTitle>
          <DialogDescription>Tick a role to give it, untick to take it. Taking one ends their sessions.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          {roles.map((role) => (
            <Field key={role.id} orientation="horizontal">
              <Checkbox
                id={`role-${person.id}-${role.id}`}
                checked={held.has(role.id)}
                disabled={pending}
                onCheckedChange={(on) => run(() => (on ? giveRole(person.id, role.id) : takeRole(person.id, role.id)))}
              />
              <FieldLabel htmlFor={`role-${person.id}-${role.id}`}>{role.name}</FieldLabel>
            </Field>
          ))}
        </FieldGroup>
        <DialogFooter>
          <Text role="caption">Changes are saved as you tick.</Text>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
