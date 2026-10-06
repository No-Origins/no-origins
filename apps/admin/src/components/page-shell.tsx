import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import { Button } from "@no-origins/ui/components/button";
import { Text } from "@no-origins/ui/components/text";

/**
 * The frame of the admin's access pages (Access.md A7), the Settings page's: the way home, the page's name and a line
 * of what it is, then its cards. Version 1; the screens are his to design.
 */
export function PageShell({ title, line, children }: { title: string; line: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/">
            <ArrowLeftIcon /> Home
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <Text role="title" as="h1">{title}</Text>
        <Text role="body" tone="muted">{line}</Text>
      </div>
      {children}
    </main>
  );
}

/** A page whose permission the signed-in person does not hold. */
export function NoAccess({ permission }: { permission: string }) {
  return (
    <Alert>
      <AlertTitle>Not yours to see</AlertTitle>
      <AlertDescription>This page needs {permission}, which none of your roles holds.</AlertDescription>
    </Alert>
  );
}

/** A date as the admin's pages show it, written on the server so the browser shows the same. */
export function when(iso: string | null): string {
  if (!iso) return "never";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));
}
