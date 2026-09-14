"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Container, Field, SectionHeader, Section, Stack, Text, Toast } from "@no-origins/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Sign in (Admin.md §8.4) — magic link, and nothing else on the screen.
 *
 * **The message is the same whatever happens**, and that is the design. The allowlist is the membership rule, so
 * a page that said "that address is not on the list" would be a membership oracle for anyone who found the URL.
 * It says a link is on its way if the address is known, every time. The person who actually owns the address
 * finds out by reading their email; nobody else finds out anything.
 */
function SignInForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const linkFailed = params.get("error") === "link";
  const next = params.get("next") ?? "/";

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // The result is deliberately not read. See the note above: an error here is mostly "not on the allowlist",
    // and showing it would answer a question this page should not answer.
    setState("sent");
  }

  return (
    <Section as="div">
      <Container size="sm">
        <Stack gap={24}>
          <SectionHeader
            rhythm={false}
            label="no origins · admin"
            title="Sign in"
            lead="A link, by email. There is no password to lose and no account to create — the list of people who can sign in is the list of people who have been invited."
          />

          {linkFailed ? (
            <Toast tone="bad" title="That link did not work">It may have expired — they last fifteen minutes. Ask for another.</Toast>
          ) : null}

          {state === "sent" ? (
            <Stack gap={16}>
              <Text>
                If <strong>{email}</strong> is on the list, a link is on its way. It expires in fifteen minutes.
              </Text>
              <Text as="div">
                <Button variant="ghost" onClick={() => setState("idle")}>Use a different address</Button>
              </Text>
            </Stack>
          ) : (
            <form onSubmit={send}>
              <Stack gap={16}>
                <Field
                  label="Email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />
                <Text as="div">
                  <Button type="submit" disabled={state === "sending"}>
                    {state === "sending" ? "Sending…" : "Send the link"}
                  </Button>
                </Text>
              </Stack>
            </form>
          )}
        </Stack>
      </Container>
    </Section>
  );
}

export default function SignIn() {
  // `useSearchParams` needs a boundary or the whole route opts out of static rendering.
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
