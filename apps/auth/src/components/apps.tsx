"use client";

import * as React from "react";
import {
  ActivityIcon, BookOpenIcon, BriefcaseBusinessIcon, HouseIcon, KeyRoundIcon, OrbitIcon, PaletteIcon, ShieldIcon,
  SparklesIcon, UserRoundIcon, type LucideIcon,
} from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";

import { AuthPages, band, RecordBox, type AuthItem } from "@/components/auth-pages";
import { usePasskeys } from "@/components/passkeys";
import type { Span } from "@/lib/arrange";
import type { Responsive } from "@no-origins/ui/components/grid";

export type ShownApp = { id: string; name: string; line: string; href: string };

const ICONS: Record<string, LucideIcon> = {
  motion: SparklesIcon,
  orbit: OrbitIcon,
  home: HouseIcon,
  portfolio: BriefcaseBusinessIcon,
  design: PaletteIcon,
  engineering: BookOpenIcon,
  status: ActivityIcon,
  admin: ShieldIcon,
  account: UserRoundIcon,
};

// Two cards a row on six and eight columns, three on twelve; two cells tall, so every app and the account are one page.
const CARD: Responsive<Span> = { base: { cols: 3, rows: 2 }, md: { cols: 4, rows: 2 } };

/**
 * The apps a signed-in person may open (Admin.md §8.4 step 5, his: "once they login, we can show all the subdomains to
 * go to"; Access.md A7): the public ones and each gated one whose `<app>.open` they hold — the admin only with
 * `admin.open`. A card an app on the grid, and their account's. Version 1, his to design.
 *
 * A passkey cannot make an account, so this is where one is offered: straight after a first sign-in, and until the
 * account has one.
 */
export function AppsView({ email, apps }: { email: string | null; apps: readonly ShownApp[] }) {
  const { status, passkeys, busy, error, register } = usePasskeys();
  const offer = !!email && status === "ready" && !passkeys.length;

  const items = React.useMemo<AuthItem[]>(() => {
    const out: AuthItem[] = [];
    if (offer) {
      out.push({
        id: "passkey",
        span: band(1, 2, 3),
        render: () => (
          <RecordBox className="@min-[600px]:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex min-w-0 items-center gap-3">
              <KeyRoundIcon className="text-muted-foreground size-4 shrink-0" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <Text role="body" as="span">Sign in with a tap next time</Text>
                <Text role="caption" as="span" className="line-clamp-2">
                  {error ?? "A passkey: Face ID, Touch ID or a security key. No mail, no password."}
                </Text>
              </div>
            </div>
            <Button variant="outline" onClick={() => void register()} disabled={busy}>
              {busy ? "Waiting for your device…" : "Add a passkey"}
            </Button>
          </RecordBox>
        ),
      });
    }
    for (const app of apps) out.push({ id: app.id, span: CARD, render: () => <AppCard app={app} /> });
    if (email) {
      out.push({
        id: "account",
        span: CARD,
        render: () => <AppCard app={{ id: "account", name: "Your account", line: "Password, passkeys, authenticators.", href: "/account" }} />,
      });
    }
    return out;
  }, [apps, email, offer, busy, error, register]);

  return (
    <AuthPages
      title="Your apps"
      line={email ? `Signed in as ${email}, on every app of No Origins.` : "Every app of No Origins you may open."}
      items={items}
    />
  );
}

/** An app: a card on the field, its icon, its name and a line, the whole card its link. */
function AppCard({ app }: { app: ShownApp }) {
  const Icon = ICONS[app.id] ?? SparklesIcon;
  return (
    <a href={app.href} className="group block size-full rounded-lg outline-none">
      <Slot fill="card" inset={0} className="group-hover:border-foreground group-focus-visible:border-foreground transition-colors">
        <div className="flex min-w-0 flex-col justify-between gap-2 p-4">
          <Icon className="text-muted-foreground group-hover:text-foreground size-6 shrink-0 transition-colors" />
          <div className="flex min-w-0 flex-col gap-1">
            <Text role="heading" as="h2" className="truncate">{app.name}</Text>
            <Text role="caption" className="line-clamp-2">{app.line}</Text>
          </div>
        </div>
      </Slot>
    </a>
  );
}
