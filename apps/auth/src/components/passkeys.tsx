"use client";
import { useCallback, useEffect, useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Text } from "@no-origins/ui/components/text";
import { supabaseBrowser } from "@no-origins/auth/client";
import { supabaseEnv } from "@no-origins/auth/env";
import { useWebAuthn } from "@no-origins/auth/webauthn";

import { RecordBox } from "@/components/auth-pages";

export type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

/** The passkeys on this account, or `null` when the list call fails. */
async function listPasskeys(): Promise<Passkey[] | null> {
  const { data, error } = await supabaseBrowser().auth.passkey.list();
  if (error) return null;
  return data ?? [];
}

export type Passkeys = {
  /** `checking` until the list is in; `unsupported` when the browser has no authenticator or the server has passkeys off. */
  status: "checking" | "unsupported" | "ready";
  passkeys: Passkey[];
  busy: boolean;
  error: string | null;
  register: () => Promise<void>;
  remove: (passkeyId: string) => Promise<void>;
};

/**
 * Passkey enrollment (Admin.md §8.4 — the third door), as state the account page lays out on the field: a record for
 * each passkey (account.tsx). The admin's Settings had it until the account moved here (step 5).
 *
 * You register a passkey *here*, while signed in — the session is the proof it belongs to you, so there is no
 * address to type and no oracle to leak. Once one exists, the login card's "Sign in with a passkey" button uses
 * it for a one-tap, phishing-resistant sign-in with no email round-trip.
 *
 * All of this is Supabase's experimental passkey API and needs the server to have passkeys enabled (`config.toml`
 * locally, the dashboard on the hosted project). If it is off, `list()` errors and the page says what to do
 * rather than showing a broken button.
 */
export function usePasskeys(): Passkeys {
  const webauthn = useWebAuthn();
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  const show = useCallback((list: Passkey[] | null) => {
    setUnsupported(list === null);
    setPasskeys(list ?? []);
  }, []);

  const load = useCallback(async () => show(await listPasskeys()), [show]);

  // Nothing to list on a server with no keys (CI's review sweep): the page is there, and nobody is signed in.
  const keyed = !!supabaseEnv();
  useEffect(() => {
    if (webauthn && keyed) void listPasskeys().then(show);
  }, [webauthn, keyed, show]);

  const register = useCallback(async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.registerPasskey();
    setBusy(false);
    if (error) {
      if (!/cancel|abort|NotAllowed/i.test(error.message)) setError(error.message);
      return;
    }
    await load();
  }, [load]);

  const remove = useCallback(async (passkeyId: string) => {
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.passkey.delete({ passkeyId });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  }, [load]);

  const status = unsupported || webauthn === false || !keyed ? "unsupported" : passkeys === null ? "checking" : "ready";
  return { status, passkeys: passkeys ?? [], busy, error, register, remove };
}

/** One passkey, a record on the field. */
export function PasskeyRecord({ passkey, busy, onRemove }: { passkey: Passkey; busy: boolean; onRemove: () => void }) {
  return (
    <RecordBox className="flex-row items-center justify-between @min-[600px]:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <KeyRound className="text-muted-foreground size-4 shrink-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Text role="body" as="span" className="truncate">{passkey.friendly_name || "Passkey"}</Text>
          <Text role="caption" as="span" className="truncate">Added {new Date(passkey.created_at).toLocaleDateString()}</Text>
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Remove passkey" disabled={busy} onClick={onRemove}>
        <Trash2 />
      </Button>
    </RecordBox>
  );
}
