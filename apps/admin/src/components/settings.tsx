"use client";

import * as React from "react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Text } from "@no-origins/ui/components/text";

import { AdminPages, band, NoteBox, RecordBox, type AdminItem } from "@/components/admin-pages";
import { PasskeyRecord, usePasskeys } from "@/components/passkeys";
import { SetPassword } from "@/components/set-password";

// The thing, its detail, and what it does: on one row from 600px.
const ROW_COLS = "@min-[600px]:grid-cols-[minmax(0,1fr)_auto_auto]";
const HEAD_COLS = "@min-[600px]:grid-cols-[minmax(0,1fr)_auto]";

/**
 * Settings (Admin.md §0.5) — the account controls that used to be the whole signed-in landing, on the field: who you
 * are and the way out, your password, then your passkeys, a record each. The self rights of Access.md A2: no
 * permission is asked for any of it.
 */
export function SettingsView({ email, roles }: { email: string; roles: string[] }) {
  const { status, passkeys, busy, error, register, remove } = usePasskeys();

  const items = React.useMemo<AdminItem[]>(() => {
    const out: AdminItem[] = [
      {
        id: "account",
        span: band(1, 2, 2),
        render: () => (
          <RecordBox className={ROW_COLS}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <Text role="body" as="span" className="truncate">{email}</Text>
              <Text role="caption" as="span">Signed in to every app of No Origins</Text>
            </div>
            {/* One line under the address when stacked; two of the row's columns from 600px. */}
            <div className="flex items-center justify-between gap-4 @min-[600px]:contents">
              <div className="flex flex-wrap gap-1">{roles.map((name) => <Badge key={name} variant="secondary">{name}</Badge>)}</div>
              <form action="/auth/sign-out" method="post">
                <Button type="submit" variant="outline">Sign out</Button>
              </form>
            </div>
          </RecordBox>
        ),
      },
      { id: "password", span: band(1, 2, 3), render: () => <SetPassword /> },
      {
        id: "passkeys",
        span: band(1, 2, 3),
        render: () => (
          <RecordBox className={HEAD_COLS}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <Text role="body" as="span">Passkeys</Text>
              <Text role="caption" as="span" className="line-clamp-2">
                The fastest, phishing-resistant door: a tap with Face ID, Touch ID or a security key, no email round-trip.
              </Text>
            </div>
            <Button variant="outline" onClick={() => void register()} disabled={busy || status !== "ready"}>
              {busy ? "Waiting for your device…" : "Register a passkey"}
            </Button>
          </RecordBox>
        ),
      },
    ];
    if (error) out.push({ id: "passkey-error", span: band(1, 2, 2), render: () => <NoteBox title="Something went wrong">{error}</NoteBox> });
    if (status === "checking") out.push({ id: "passkeys-checking", span: band(1), render: () => <NoteBox>Checking for passkeys…</NoteBox> });
    else if (status === "unsupported") {
      out.push({
        id: "passkeys-off",
        span: band(1, 2, 3),
        render: () => (
          <NoteBox title="Passkeys are not available">
            Either this browser has no authenticator, or passkeys are turned off on the server: enable [auth.passkey] in
            supabase/config.toml (or the hosted dashboard) and restart.
          </NoteBox>
        ),
      });
    } else if (!passkeys.length) {
      out.push({ id: "passkeys-none", span: band(1, 1, 2), render: () => <NoteBox>No passkeys yet. Register one and sign in with a tap next time.</NoteBox> });
    } else {
      for (const pk of passkeys) out.push({ id: `passkey-${pk.id}`, span: band(1), render: () => <PasskeyRecord passkey={pk} busy={busy} onRemove={() => void remove(pk.id)} /> });
    }
    return out;
  }, [email, roles, status, passkeys, busy, error, register, remove]);

  return <AdminPages title="Settings" line="Your account, your password and your passkeys." items={items} />;
}
