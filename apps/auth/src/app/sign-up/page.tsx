import { SignUpCard } from "@no-origins/auth/cards";

import { CardScreen } from "@/components/card-screen";

export const metadata = { title: "Make an account" };

/**
 * Making an account (Admin.md §8.4, step 5; his doors, 2026-10-08): an email and a password, or an email link or code.
 * A new account is a Member (Access.md A4). Until the allowlist's refusal goes — the last step of step 5 — only an
 * invited address can make one, and the page answers every address the same.
 */
export default function SignUp() {
  return <CardScreen><SignUpCard /></CardScreen>;
}
