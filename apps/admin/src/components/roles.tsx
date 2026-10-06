"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@no-origins/ui/components/table";
import { Text } from "@no-origins/ui/components/text";
import { Textarea } from "@no-origins/ui/components/textarea";

import { createRole, deleteRole, makeDefault, renameRole, setPermission } from "@/app/access/actions";
import { Refusal, useChange } from "@/components/outcome";
import { Confirm } from "@/components/people-table";

export type RoleRow = {
  id: string;
  name: string;
  sentence: string;
  builtIn: "owner" | "member" | null;
  isDefault: boolean;
  permissions: string[];
  holders: number;
};

export type CatalogueEntry = { name: string; app: string; sentence: string };

/** Every role (Access.md A4, A7): built in or his, the default, how many hold it and what it grants. */
export function RolesTable({ roles, total }: { roles: RoleRow[]; total: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Role</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead>Held by</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="xs">
                    <Link href={`/roles/${role.id}`}>{role.name}</Link>
                  </Button>
                  {role.builtIn ? <Badge variant="secondary">Built in</Badge> : null}
                  {role.isDefault ? <Badge variant="outline">Default</Badge> : null}
                </div>
                {role.sentence ? <Text role="caption" as="span">{role.sentence}</Text> : null}
              </div>
            </TableCell>
            <TableCell><Text role="caption" as="span">{role.builtIn === "owner" ? `all ${total}` : role.permissions.length}</Text></TableCell>
            <TableCell><Text role="caption" as="span">{role.holders}</Text></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** A new role: a name and a sentence; its permissions are ticked on its own page. */
export function NewRole() {
  const router = useRouter();
  const { pending, refusal, run } = useChange();
  const [name, setName] = React.useState("");
  const [sentence, setSentence] = React.useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(async () => {
          const done = await createRole(name, sentence);
          if (done.ok && done.id) router.push(`/roles/${done.id}`);
          return done;
        });
      }}
    >
      <FieldGroup>
        <Refusal message={refusal} />
        <Field>
          <FieldLabel htmlFor="role-name">Name</FieldLabel>
          <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Friend" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="role-sentence">What it is for</FieldLabel>
          <Input id="role-sentence" value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="Family who may see the house" />
        </Field>
        <Button type="submit" disabled={pending || !name.trim()}>Make the role</Button>
      </FieldGroup>
    </form>
  );
}

/**
 * One role (Access.md A4): its name and sentence, its permissions ticked by app with each one's sentence, the default,
 * and deleting it. The Owner holds everything and changes nothing here; a built-in role is never deleted. What the
 * signed-in person may not grant, the database refuses, and the refusal is shown.
 */
export function RoleEditor({ role, catalogue, mayManage }: { role: RoleRow; catalogue: CatalogueEntry[]; mayManage: boolean }) {
  const router = useRouter();
  const { pending, refusal, run } = useChange();
  const [name, setName] = React.useState(role.name);
  const [sentence, setSentence] = React.useState(role.sentence);
  const owner = role.builtIn === "owner";
  const editable = mayManage && !owner;
  const apps = [...new Set(catalogue.map((p) => p.app))];
  const held = new Set(role.permissions);
  return (
    <FieldGroup>
      <Refusal message={refusal} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          run(() => renameRole(role.id, name, sentence));
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!mayManage || owner} />
          </Field>
          <Field>
            <FieldLabel htmlFor="sentence">What it is for</FieldLabel>
            <Textarea id="sentence" value={sentence} onChange={(e) => setSentence(e.target.value)} disabled={!mayManage || owner} />
          </Field>
          {mayManage && !owner ? (
            <Button type="submit" variant="outline" disabled={pending || (name === role.name && sentence === role.sentence)}>Save</Button>
          ) : null}
        </FieldGroup>
      </form>

      {owner ? (
        <Text role="body" tone="muted">The Owner holds every permission, those added later included, and is never given or taken here.</Text>
      ) : (
        apps.map((app) => (
          <FieldSet key={app}>
            <FieldLegend>{app}</FieldLegend>
            <FieldGroup>
              {catalogue.filter((p) => p.app === app).map((p) => (
                <Field key={p.name} orientation="horizontal">
                  <Checkbox
                    id={p.name}
                    checked={held.has(p.name)}
                    disabled={!editable || pending}
                    onCheckedChange={(on) => run(() => setPermission(role.id, p.name, on === true))}
                  />
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel htmlFor={p.name} className="font-mono">{p.name}</FieldLabel>
                    <FieldDescription>{p.sentence}</FieldDescription>
                  </div>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>
        ))
      )}

      {editable ? (
        <div className="flex flex-wrap gap-2">
          {!role.isDefault ? (
            <Confirm
              label="Make default"
              title={`Make ${role.name} the default?`}
              line="Everyone who signs up from now on gets this role instead."
              pending={pending}
              onConfirm={() => run(() => makeDefault(role.id))}
            />
          ) : null}
          {!role.builtIn && !role.isDefault ? (
            <Confirm
              label="Delete role"
              destructive
              title={`Delete ${role.name}?`}
              line={role.holders ? "Someone still holds it: take it from them first." : "Nobody holds it. The audit log keeps that it was."}
              pending={pending}
              onConfirm={() => run(() => deleteRole(role.id), () => router.push("/roles"))}
            />
          ) : null}
        </div>
      ) : null}
    </FieldGroup>
  );
}
