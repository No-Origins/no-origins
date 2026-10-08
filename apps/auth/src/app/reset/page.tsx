import { ResetCard } from "@no-origins/auth/cards";

import { CardScreen } from "@/components/card-screen";

export const metadata = { title: "A new password" };

/**
 * The new password (Admin.md §8.4, step 5), signed in by the link from the mail — the gate sends anyone else to sign in
 * first. An account with an authenticator gives its code before the password is taken.
 */
export default function Reset() {
  return <CardScreen><ResetCard /></CardScreen>;
}
