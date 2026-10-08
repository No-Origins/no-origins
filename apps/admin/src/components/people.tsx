"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@no-origins/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@no-origins/ui/components/field";
import { Text } from "@no-origins/ui/components/text";

import { endSessions, removeAccount, setRoles } from "@/app/access/actions";
import { AdminPages, band, ColumnNames, RecordBox, useStepUp, wideOnly, type AdminItem } from "@/components/admin-pages";
import { Confirm, useChange } from "@/components/outcome";

export type PersonRow = {
  id: string;
  email: string;
  name: string | null;
  kind: "person" | "agent";
  joined: string;
  lastSignIn: string;
  roles: { id: string; name: string; builtIn: "owner" | "member" | null }[];
};

type RoleChoice = { id: string; name: string };

// Who · roles · (from 800px) when · what may be done. Written out whole, so Tailwind sees each class.
const COLS = "@min-[600px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_15rem] @min-[800px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_11rem_15rem]";
const COLS_READ = "@min-[600px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] @min-[800px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_11rem]";
const WHEN = "hidden @min-[800px]:block";

/**
 * People (Access.md A7): everyone and every agent, a record each on the field — their roles, when they joined and last
 * signed in, and what the signed-in person may do to them: give and take roles (`admin.people.assign`), end their
 * sessions and remove them (`admin.people.remove`). The Owner and oneself have no actions here: the database refuses
 * both anyway.
 */
export function PeopleView({ people, roles, me, mayAssign, mayRemove }: {
  people: PersonRow[];
  roles: RoleChoice[];
  me: string | null;
  mayAssign: boolean;
  mayRemove: boolean;
}) {
  const acts = mayAssign || mayRemove;
  const cols = acts ? COLS : COLS_READ;
  const items = React.useMemo<AdminItem[]>(() => [
    {
      id: "columns",
      repeat: true,
      span: wideOnly(),
      render: () => <ColumnNames className={cols} names={["Who", "Roles", { name: "Seen", className: WHEN }, ...(acts ? [{ name: "Change", className: "text-right" }] : [])]} />,
    },
    ...people.map((person): AdminItem => {
      const actable = acts && !person.roles.some((r) => r.builtIn === "owner") && person.id !== me;
      return {
        id: person.id,
        span: band(1, 2, actable ? 3 : 2),
        render: () => <Person person={person} roles={roles} me={me} actable={actable} mayAssign={mayAssign} mayRemove={mayRemove} cols={cols} />,
      };
    }),
  ], [people, roles, me, acts, mayAssign, mayRemove, cols]);
  return <AdminPages title="People" line="Everyone and every agent, and their roles. Taking a role signs the person out at once." items={items} />;
}

function Person({ person, roles, me, actable, mayAssign, mayRemove, cols }: {
  person: PersonRow;
  roles: RoleChoice[];
  me: string | null;
  actable: boolean;
  mayAssign: boolean;
  mayRemove: boolean;
  cols: string;
}) {
  const { pending, run } = useChange();
  const who = person.name ?? person.email;
  return (
    <RecordBox className={cols}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Text role="body" as="span" className="truncate">{who}</Text>
        <div className="flex min-w-0 items-center gap-2">
          {person.name ? <Text role="caption" as="span" className="truncate">{person.email}</Text> : null}
          {person.kind === "agent" ? <Badge variant="secondary">Agent</Badge> : null}
          {person.id === me ? <Badge variant="outline">You</Badge> : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap gap-1 overflow-hidden">
        {person.roles.length
          ? person.roles.map((r) => <Badge key={r.id} variant={r.builtIn === "owner" ? "default" : "outline"}>{r.name}</Badge>)
          : <Text role="caption" as="span">No role</Text>}
      </div>
      <div className={`min-w-0 ${WHEN}`}>
        <Text role="caption" as="span" className="block truncate">Joined {person.joined}</Text>
        <Text role="caption" as="span" className="block truncate">Last in {person.lastSignIn}</Text>
      </div>
      {actable ? (
        <div className="flex flex-wrap gap-2 @min-[600px]:justify-end">
          {mayAssign ? <RolesDialog person={person} roles={roles} /> : null}
          {mayRemove ? (
            <>
              <Confirm
                label="End sessions"
                title={`End ${who}'s sessions?`}
                line="They are signed out of every app at once and must sign in again."
                pending={pending}
                onConfirm={() => run(() => endSessions(person.id))}
              />
              <Confirm
                label="Remove"
                destructive
                title={`Remove ${who}?`}
                line="Their account and roles go. The audit log keeps what they did."
                pending={pending}
                onConfirm={() => run(() => removeAccount(person.id))}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </RecordBox>
  );
}

/**
 * A person's roles (Access.md A7), ticked and then saved (his, 2026-10-07): the dialog holds the draft, opening it
 * starts again from what they hold, and Save sends the whole set, which the database gives and takes in one transaction
 * (`noo_set_roles`). Roles the dialog does not list (the Owner) are sent as held, so a save never takes one unseen. A
 * refusal is shown in the dialog, which stays open over the page's name, where the other changes show theirs.
 */
function RolesDialog({ person, roles }: { person: PersonRow; roles: RoleChoice[] }) {
  const held = new Set(person.roles.map((r) => r.id));
  const [open, setOpen] = React.useState(false);
  const [ticked, setTicked] = React.useState<ReadonlySet<string>>(held);
  const [refusal, setRefusal] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const changes = roles.filter((r) => ticked.has(r.id) !== held.has(r.id));
  const taking = changes.some((r) => held.has(r.id));
  const unlisted = person.roles.filter((r) => !roles.some((listed) => listed.id === r.id)).map((r) => r.id);
  const status = pending
    ? "Saving…"
    : !changes.length
      ? "Nothing to save."
      : `${changes.length} ${changes.length === 1 ? "change" : "changes"} unsaved.${taking ? " Taking a role signs them out at once." : ""}`;
  const stepUp = useStepUp();
  // Giving a role that holds an admin permission needs a fresh code (Access.md A12): asked for, then the same save again.
  const save = () => {
    setRefusal(null);
    start(async () => {
      const result = await setRoles(person.id, [...roles.filter((r) => ticked.has(r.id)).map((r) => r.id), ...unlisted]);
      if (result.ok) setOpen(false);
      else if (result.secondFactor) stepUp(save);
      else setRefusal(result.message);
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setTicked(new Set(held));
          setRefusal(null);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="xs" variant="outline">Roles</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person.name ?? person.email}</DialogTitle>
          <DialogDescription>Tick the roles they should hold, then save. Taking one ends their sessions.</DialogDescription>
        </DialogHeader>
        {refusal ? (
          <Alert variant="destructive">
            <AlertTitle>Not done</AlertTitle>
            <AlertDescription>{refusal}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
          {roles.map((role) => (
            <Field key={role.id} orientation="horizontal">
              <Checkbox
                id={`role-${person.id}-${role.id}`}
                checked={ticked.has(role.id)}
                disabled={pending}
                onCheckedChange={(on) => setTicked(new Set([...ticked].filter((id) => id !== role.id).concat(on === true ? [role.id] : [])))}
              />
              <FieldLabel htmlFor={`role-${person.id}-${role.id}`}>{role.name}</FieldLabel>
            </Field>
          ))}
        </FieldGroup>
        <DialogFooter className="sm:items-center sm:justify-between">
          <Text role="caption" aria-live="polite">{status}</Text>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={pending}>Cancel</Button>
            </DialogClose>
            <Button disabled={!changes.length || pending} onClick={save}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
