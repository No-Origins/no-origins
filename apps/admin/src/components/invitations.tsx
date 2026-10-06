"use client";

import * as React from "react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@no-origins/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@no-origins/ui/components/table";
import { Text } from "@no-origins/ui/components/text";

import { invite, revoke } from "@/app/access/actions";
import { Refusal, useChange } from "@/components/outcome";
import { Confirm } from "@/components/people-table";

export type InvitationRow = { email: string; invited: string; expires: string; state: "open" | "used" | "expired"; roles: string[] };

/**
 * An invitation (Access.md A7): an address, the roles signing up with it gives instead of the default, and how long it
 * lasts. Until sign-up opens to everyone (A11 step 5) it is also what lets an address make an account at all.
 */
export function InviteForm({ roles }: { roles: { id: string; name: string }[] }) {
  const { pending, refusal, run } = useChange();
  const [email, setEmail] = React.useState("");
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [days, setDays] = React.useState("14");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() => invite(email, [...picked], Number(days)), () => {
          setEmail("");
          setPicked(new Set());
        });
      }}
    >
      <FieldGroup>
        <Refusal message={refusal} />
        <Field>
          <FieldLabel htmlFor="invite-email">Address</FieldLabel>
          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="someone@example.com" required />
        </Field>
        <FieldSet>
          <FieldLegend>Roles</FieldLegend>
          <FieldGroup>
            {roles.map((role) => (
              <Field key={role.id} orientation="horizontal">
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
                <FieldLabel htmlFor={`invite-${role.id}`}>{role.name}</FieldLabel>
              </Field>
            ))}
          </FieldGroup>
          <Text role="caption">None ticked: they get the default role.</Text>
        </FieldSet>
        <Field>
          <FieldLabel htmlFor="invite-days">Lasts</FieldLabel>
          <NativeSelect id="invite-days" value={days} onChange={(e) => setDays(e.target.value)}>
            <NativeSelectOption value="7">7 days</NativeSelectOption>
            <NativeSelectOption value="14">14 days</NativeSelectOption>
            <NativeSelectOption value="30">30 days</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Button type="submit" disabled={pending || !email.trim()}>Invite</Button>
      </FieldGroup>
    </form>
  );
}

export function InvitationsTable({ invitations, mayManage }: { invitations: InvitationRow[]; mayManage: boolean }) {
  const { pending, refusal, run } = useChange();
  if (!invitations.length) return <Text role="body" tone="muted">No invitations yet.</Text>;
  return (
    <div className="flex flex-col gap-4">
      <Refusal message={refusal} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Until</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((i) => (
            <TableRow key={i.email}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Text role="body" as="span">{i.email}</Text>
                  {i.state !== "open" ? <Badge variant="secondary">{i.state === "used" ? "Used" : "Expired"}</Badge> : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {i.roles.length ? i.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>) : <Text role="caption" as="span">The default</Text>}
                </div>
              </TableCell>
              <TableCell><Text role="caption" as="span">{i.invited}</Text></TableCell>
              <TableCell><Text role="caption" as="span">{i.expires}</Text></TableCell>
              <TableCell className="text-right">
                {mayManage && i.state === "open" ? (
                  <Confirm
                    label="Revoke"
                    destructive
                    title={`Revoke the invitation for ${i.email}?`}
                    line="The address can no longer make an account with it."
                    pending={pending}
                    onConfirm={() => run(() => revoke(i.email))}
                  />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
