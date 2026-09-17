"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@no-origins/ui/components/button";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@no-origins/ui/components/item";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@no-origins/ui/components/empty";
import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { Spinner } from "@no-origins/ui/components/spinner";
import { KeyRound, Trash2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

/**
 * Passkey enrollment (Admin.md §8.4 — the third door).
 *
 * You register a passkey *here*, while signed in — the session is the proof it belongs to you, so there is no
 * address to type and no oracle to leak. Once one exists, the login card's "Sign in with a passkey" button uses
 * it for a one-tap, phishing-resistant sign-in with no email round-trip.
 *
 * All of this is Supabase's experimental passkey API and needs the server to have passkeys enabled (`config.toml`
 * locally, the dashboard on the hosted project). If it is off, `list()` errors and this card explains what to do
 * rather than showing a broken button.
 */
export function Passkeys() {
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.passkey.list();
    if (error) {
      // A 404/feature-off reads as "not enabled on the server"; anything else is a real error.
      setUnsupported(true);
      setPasskeys([]);
      return;
    }
    setUnsupported(false);
    setPasskeys(data ?? []);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.PublicKeyCredential) {
      setUnsupported(true);
      setPasskeys([]);
      return;
    }
    void load();
  }, [load]);

  async function register() {
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.registerPasskey();
    setBusy(false);
    if (error) {
      // A user who dismisses the OS prompt is not an error worth shouting about.
      if (!/cancel|abort|NotAllowed/i.test(error.message)) setError(error.message);
      return;
    }
    await load();
  }

  async function remove(passkeyId: string) {
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.passkey.delete({ passkeyId });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  }

  if (unsupported) {
    return (
      <Alert>
        <KeyRound />
        <AlertTitle>Passkeys are not available</AlertTitle>
        <AlertDescription>
          Either this browser has no authenticator, or passkeys are turned off on the server. Enable
          <code className="mx-1">[auth.passkey]</code> in <code>supabase/config.toml</code> (or the hosted
          dashboard) and restart.
        </AlertDescription>
      </Alert>
    );
  }

  if (passkeys === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner /> Checking for passkeys…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {passkeys.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <KeyRound />
            </EmptyMedia>
            <EmptyTitle>No passkeys yet</EmptyTitle>
            <EmptyDescription>Register one and sign in with a tap next time — no email round-trip.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {passkeys.map((pk) => (
            <Item key={pk.id} variant="outline" size="sm">
              <ItemMedia variant="icon">
                <KeyRound />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{pk.friendly_name || "Passkey"}</ItemTitle>
                <ItemDescription>Added {new Date(pk.created_at).toLocaleDateString()}</ItemDescription>
              </ItemContent>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove passkey"
                disabled={busy}
                onClick={() => remove(pk.id)}
              >
                <Trash2 />
              </Button>
            </Item>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={register} disabled={busy}>
        {busy ? "Waiting for your device…" : "Register a passkey"}
      </Button>
    </div>
  );
}
