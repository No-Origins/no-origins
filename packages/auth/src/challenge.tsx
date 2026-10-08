"use client";

import * as React from "react";

import { Text } from "@no-origins/ui/components/text";

/**
 * The challenge on the login's forms (Admin.md §8.4, step 5; his, 2026-10-08: Cloudflare Turnstile). Anyone with the
 * address can make accounts once sign-up opens, so every form that asks Supabase to send a mail or check a password
 * carries a Turnstile token, which Supabase checks once its CAPTCHA protection is switched on.
 *
 * **Inert without a site key.** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` unset — a fresh clone, CI, production before he has
 * made the Turnstile site — and there is no widget, no script and no token: the forms send nothing, which Supabase
 * accepts for as long as its protection is off. The order is his: the key in the auth app's environment, every card
 * sending tokens, and only then the switch in Supabase (with the secret beside it), so no sign-in is ever refused for a
 * token nobody sent.
 *
 * Cloudflare's widget, not a component of the design system: an iframe Cloudflare draws, shown only when it wants a
 * person to act (`appearance: "interaction-only"`), in the page's theme. A token is good once, so a form resets the
 * challenge after every request it sends.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let loading: Promise<Turnstile> | null = null;

function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not start")));
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile did not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export type Challenge = {
  /** A site key is set, so the form carries a token. */
  on: boolean;
  /** The token to send as `captchaToken`; `undefined` when the challenge is off or not passed yet. */
  token: string | undefined;
  /** The form may send: the challenge is off, or passed. */
  ready: boolean;
  /** The widget could not load (blocked, offline): the form says so rather than wait. */
  failed: boolean;
  /** A fresh challenge, after a request spent the token. */
  reset: () => void;
  /** For `ChallengeBox`. */
  round: number;
  set: (token: string | null) => void;
  fail: () => void;
};

export function useChallenge(): Challenge {
  const [token, setToken] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [round, setRound] = React.useState(0);
  const reset = React.useCallback(() => {
    setToken(null);
    setRound((n) => n + 1);
  }, []);
  const fail = React.useCallback(() => setFailed(true), []);
  const on = !!SITE_KEY;
  return { on, token: token ?? undefined, ready: !on || !!token, failed, reset, round, set: setToken, fail };
}

/** Where Cloudflare draws its widget, when it has to ask; nothing at all with no site key. */
export function ChallengeBox({ challenge }: { challenge: Challenge }) {
  const box = React.useRef<HTMLDivElement>(null);
  const { round, set, fail } = challenge;

  React.useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let id: string | null = null;
    let gone = false;
    loadTurnstile()
      .then((turnstile) => {
        if (gone || !box.current) return;
        id = turnstile.render(box.current, {
          sitekey: SITE_KEY,
          theme: "auto",
          appearance: "interaction-only",
          callback: (token: string) => set(token),
          "expired-callback": () => set(null),
          "error-callback": () => set(null),
        });
      })
      .catch(fail);
    return () => {
      gone = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [round, set, fail]);

  if (!SITE_KEY) return null;
  return (
    <>
      <div ref={box} className="empty:hidden" />
      {challenge.failed ? (
        <Text role="caption" tone="muted">
          The check that you are a person did not load. Allow challenges.cloudflare.com, or try another network.
        </Text>
      ) : null}
    </>
  );
}
