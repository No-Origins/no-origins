"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@no-origins/ui/components/input-group";
import { Label } from "@no-origins/ui/components/label";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

import { createRole, deleteRole, makeDefault, renameRole, setPermission } from "@/app/access/actions";
import { AdminPages, band, ColumnNames, NoteBox, RecordBox, wideOnly, type AdminItem } from "@/components/admin-pages";
import { Confirm, useChange } from "@/components/outcome";

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

// Role · permissions · held by.
const ROLE_COLS = "@min-[600px]:grid-cols-[minmax(0,1fr)_9rem_7rem]";
// The name, what it is for, and the change: on one row from 600px.
const FORM_COLS = "@min-[600px]:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]";
// Ticked · the permission · what it allows.
const PERM_COLS = "@min-[600px]:grid-cols-[auto_14rem_minmax(0,1fr)]";

// ── /roles ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Roles (Access.md A4, A7): every role a record on the field, each a link to its own page, and a new one. */
export function RolesView({ roles, total, mayManage }: { roles: RoleRow[]; total: number; mayManage: boolean }) {
  const items = React.useMemo<AdminItem[]>(() => [
    { id: "columns", repeat: true, span: wideOnly(), render: () => <ColumnNames className={ROLE_COLS} names={["Role", "Permissions", "Held by"]} /> },
    ...roles.map((role): AdminItem => ({ id: role.id, span: band(1, 2, 2), render: () => <RoleLink role={role} total={total} /> })),
    ...(mayManage ? [{ id: "new-role", span: band(1, 2, 3), render: () => <NewRole /> }] : []),
  ], [roles, total, mayManage]);
  return <AdminPages title="Roles" line="A role is a set of permissions you make here. Owner and Member are built in; Member is what a sign-up gets." items={items} />;
}

function RoleLink({ role, total }: { role: RoleRow; total: number }) {
  const count = role.builtIn === "owner" ? `all ${total}` : String(role.permissions.length);
  return (
    <Link href={`/roles/${role.id}`} className="group block size-full rounded-lg outline-none">
      <RecordBox className={ROLE_COLS} interactive>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <Text role="body" as="span" className="truncate font-medium">{role.name}</Text>
            {role.builtIn ? <Badge variant="secondary">Built in</Badge> : null}
            {role.isDefault ? <Badge variant="outline">Default</Badge> : null}
          </div>
          {role.sentence ? <Text role="caption" as="span" className="truncate">{role.sentence}</Text> : null}
        </div>
        <Text role="caption" as="span">{count}<span className="@min-[600px]:hidden"> permissions</span></Text>
        <Text role="caption" as="span"><span className="@min-[600px]:hidden">Held by </span>{role.holders}</Text>
      </RecordBox>
    </Link>
  );
}

/** A new role: a name and a sentence; its permissions are ticked on its own page, where making it takes you. */
function NewRole() {
  const router = useRouter();
  const { pending, run } = useChange();
  const [name, setName] = React.useState("");
  const [sentence, setSentence] = React.useState("");
  return (
    <form
      className="size-full"
      onSubmit={(event) => {
        event.preventDefault();
        run(async () => {
          const done = await createRole(name, sentence);
          if (done.ok && done.id) router.push(`/roles/${done.id}`);
          return done;
        });
      }}
    >
      <RecordBox className={FORM_COLS}>
        <InputGroup>
          <InputGroupAddon><InputGroupText>New role</InputGroupText></InputGroupAddon>
          <InputGroupInput aria-label="The new role's name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Friend" required />
        </InputGroup>
        <InputGroup>
          <InputGroupAddon><InputGroupText>For</InputGroupText></InputGroupAddon>
          <InputGroupInput aria-label="What it is for" value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="Family who may see the house" />
        </InputGroup>
        <Button type="submit" disabled={pending || !name.trim()}>Make the role</Button>
      </RecordBox>
    </form>
  );
}

// ── /roles/<id> ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * One role (Access.md A4): its name and sentence, the default and deleting it, then its permissions by app, one
 * record each with its sentence. The Owner holds everything and changes nothing here; a built-in role is never
 * deleted. What the signed-in person may not grant, the database refuses, and the refusal is shown under the name.
 */
export function RoleView({ role, catalogue, mayManage, line }: { role: RoleRow; catalogue: CatalogueEntry[]; mayManage: boolean; line: string }) {
  const owner = role.builtIn === "owner";
  const editable = mayManage && !owner;
  const items = React.useMemo<AdminItem[]>(() => {
    const apps = [...new Set(catalogue.map((p) => p.app))];
    const held = new Set(role.permissions);
    // Stacked on six columns: two fields, and the Save button where it may be changed.
    const out: AdminItem[] = [{ id: "about", span: band(1, 2, editable ? 3 : 2), render: () => <RoleForm role={role} mayManage={mayManage} /> }];
    // The default is neither moved to itself nor deleted, so the default role has no changes here.
    if (editable && !role.isDefault) {
      out.push({ id: "changes", span: band(1), render: () => <RoleChanges role={role} /> });
    }
    if (owner) {
      out.push({ id: "owner", span: band(1, 2, 2), render: () => <NoteBox>The Owner holds every permission, those added later included, and is never given or taken here.</NoteBox> });
      return out;
    }
    for (const app of apps) {
      const perms = catalogue.filter((p) => p.app === app);
      const ticked = perms.filter((p) => held.has(p.name)).length;
      out.push({ id: `app-${app}`, span: band(1), render: () => <AppName app={app} ticked={ticked} of={perms.length} /> });
      for (const p of perms) {
        out.push({ id: p.name, span: band(1, 2, 2), render: () => <PermissionBox role={role} permission={p} held={held.has(p.name)} editable={editable} /> });
      }
    }
    return out;
  }, [role, catalogue, mayManage, owner, editable]);
  return <AdminPages title={role.name} line={line} back={{ href: "/roles", label: "Roles" }} items={items} />;
}

function RoleForm({ role, mayManage }: { role: RoleRow; mayManage: boolean }) {
  const { pending, run } = useChange();
  const [name, setName] = React.useState(role.name);
  const [sentence, setSentence] = React.useState(role.sentence);
  const locked = !mayManage || role.builtIn === "owner";
  return (
    <form
      className="size-full"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => renameRole(role.id, name, sentence));
      }}
    >
      <RecordBox className={FORM_COLS}>
        <InputGroup>
          <InputGroupAddon><InputGroupText>Name</InputGroupText></InputGroupAddon>
          <InputGroupInput aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={locked} />
        </InputGroup>
        <InputGroup>
          <InputGroupAddon><InputGroupText>For</InputGroupText></InputGroupAddon>
          <InputGroupInput aria-label="What it is for" value={sentence} onChange={(e) => setSentence(e.target.value)} disabled={locked} />
        </InputGroup>
        {locked ? null : (
          <Button type="submit" variant="outline" disabled={pending || (name === role.name && sentence === role.sentence)}>Save</Button>
        )}
      </RecordBox>
    </form>
  );
}

/** Moving the default to this role, and deleting it. */
function RoleChanges({ role }: { role: RoleRow }) {
  const router = useRouter();
  const { pending, run } = useChange();
  return (
    <Slot fill="background" inset={0} alignY="center">
      <div className="flex flex-wrap gap-2 px-6">
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
    </Slot>
  );
}

/** An app's name over its permissions, and how many of them the role holds. */
function AppName({ app, ticked, of }: { app: string; ticked: number; of: number }) {
  return (
    <Slot fill="background" inset={0} alignY="end">
      <div className="flex items-baseline gap-3 px-6 pb-2">
        <Text role="label" as="h2">{app}</Text>
        <Text role="caption" as="span">{ticked} of {of}</Text>
      </div>
    </Slot>
  );
}

function PermissionBox({ role, permission, held, editable }: { role: RoleRow; permission: CatalogueEntry; held: boolean; editable: boolean }) {
  const { pending, run } = useChange();
  const id = `permission-${permission.name}`;
  return (
    <RecordBox className={PERM_COLS}>
      <div className="flex min-w-0 items-center gap-3 @min-[600px]:contents">
        <Checkbox
          id={id}
          checked={held}
          disabled={!editable || pending}
          onCheckedChange={(on) => run(() => setPermission(role.id, permission.name, on === true))}
        />
        <Label htmlFor={id} className="min-w-0 truncate font-mono">{permission.name}</Label>
      </div>
      <Text role="caption" as="span" className="line-clamp-2">{permission.sentence}</Text>
    </RecordBox>
  );
}
