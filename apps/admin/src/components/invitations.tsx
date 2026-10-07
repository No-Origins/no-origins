"use client";

import * as React from "react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@no-origins/ui/components/input-group";
import { Label } from "@no-origins/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@no-origins/ui/components/native-select";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

import { invite, revoke } from "@/app/access/actions";
import { AdminPages, band, ColumnNames, NoteBox, RecordBox, wideOnly, type AdminItem } from "@/components/admin-pages";
import { Confirm, useChange } from "@/components/outcome";

export type InvitationRow = { email: string; invited: string; expires: string; state: "open" | "used" | "expired"; roles: string[] };

// Address · roles · (from 800px) when · the change.
const COLS = "@min-[600px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7rem] @min-[800px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_11rem_7rem]";
const WHEN = "hidden @min-[800px]:block";

/**
 * Invitations (Access.md A7): inviting someone, then every invitation a record on the field. An invitation is an
 * address, the roles signing up with it gives instead of the default, and how long it lasts; until sign-up opens to
 * everyone (A11 step 5) it is also what lets an address make an account at all.
 */
export function InvitationsView({ invitations, roles, mayManage }: {
  invitations: InvitationRow[];
  roles: { id: string; name: string }[];
  mayManage: boolean;
}) {
  const items = React.useMemo<AdminItem[]>(() => [
    { id: "invite", span: band(2, 2, 3), render: () => <InviteForm roles={roles} /> },
    ...(invitations.length
      ? [
          { id: "columns", repeat: true, span: wideOnly(), render: () => <ColumnNames className={COLS} names={["Address", "Roles", { name: "When", className: WHEN }, { name: "Change", className: "text-right" }]} /> },
          ...invitations.map((i): AdminItem => {
            const revocable = mayManage && i.state === "open";
            return { id: `invitation-${i.email}`, span: band(1, 2, 2), render: () => <Invitation invitation={i} revocable={revocable} /> };
          }),
        ]
      : [{ id: "none", span: band(1), render: () => <NoteBox>No invitations yet.</NoteBox> }]),
  ], [invitations, roles, mayManage]);
  return <AdminPages title="Invitations" line="An address and the roles it gets when it signs up. Until sign-up opens, an invitation is the way in." items={items} />;
}

/** Inviting: the address, how long it lasts and the button on one line; the roles under it. */
function InviteForm({ roles }: { roles: { id: string; name: string }[] }) {
  const { pending, run } = useChange();
  const [email, setEmail] = React.useState("");
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [days, setDays] = React.useState("14");
  return (
    <form
      className="size-full"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => invite(email, [...picked], Number(days)), () => {
          setEmail("");
          setPicked(new Set());
        });
      }}
    >
      <Slot fill="card" inset={0} alignY="center">
        <div className="flex min-w-0 flex-col gap-3 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <InputGroup className="min-w-56 flex-1">
              <InputGroupAddon><InputGroupText>Invite</InputGroupText></InputGroupAddon>
              <InputGroupInput aria-label="Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="someone@example.com" required />
            </InputGroup>
            <NativeSelect aria-label="Lasts" value={days} onChange={(e) => setDays(e.target.value)}>
              <NativeSelectOption value="7">For 7 days</NativeSelectOption>
              <NativeSelectOption value="14">For 14 days</NativeSelectOption>
              <NativeSelectOption value="30">For 30 days</NativeSelectOption>
            </NativeSelect>
            <Button type="submit" disabled={pending || !email.trim()}>Invite</Button>
          </div>
          <div role="group" aria-label="Roles" className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 px-3">
            <Text role="label" tone="muted" as="span">Roles</Text>
            {roles.map((role) => (
              <span key={role.id} className="flex items-center gap-2">
                <Checkbox
                  id={`invite-${role.id}`}
                  checked={picked.has(role.id)}
                  onCheckedChange={(on) => setPicked((now) => {
                    const next = new Set(now);
                    if (on) next.add(role.id);
                    else next.delete(role.id);
                    return next;
                  })}
                />
                <Label htmlFor={`invite-${role.id}`}>{role.name}</Label>
              </span>
            ))}
            <Text role="caption" as="span">None ticked: they get the default role.</Text>
          </div>
        </div>
      </Slot>
    </form>
  );
}

function Invitation({ invitation: i, revocable }: { invitation: InvitationRow; revocable: boolean }) {
  const { pending, run } = useChange();
  return (
    <RecordBox className={COLS}>
      <div className="flex min-w-0 items-center gap-2">
        <Text role="body" as="span" className="truncate">{i.email}</Text>
        {i.state !== "open" ? <Badge variant="secondary">{i.state === "used" ? "Used" : "Expired"}</Badge> : null}
      </div>
      <div className="flex min-w-0 flex-wrap gap-1 overflow-hidden">
        {i.roles.length ? i.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>) : <Text role="caption" as="span">The default</Text>}
      </div>
      <div className={`min-w-0 ${WHEN}`}>
        <Text role="caption" as="span" className="block truncate">Sent {i.invited}</Text>
        <Text role="caption" as="span" className="block truncate">Until {i.expires}</Text>
      </div>
      {revocable ? (
        <div className="flex @min-[600px]:justify-end">
          <Confirm
            label="Revoke"
            destructive
            title={`Revoke the invitation for ${i.email}?`}
            line="The address can no longer make an account with it."
            pending={pending}
            onConfirm={() => run(() => revoke(i.email))}
          />
        </div>
      ) : null}
    </RecordBox>
  );
}
