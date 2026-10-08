import { SignInCard } from "@no-origins/auth/cards";

import { CardScreen } from "@/components/card-screen";

export const metadata = { title: "Sign in" };

/**
 * Sign in (Admin.md §8.4, step 5): every app's sign-in, into the one session they share. Also where a gate sends an
 * account that cannot open its app (`?denied=1`) and one that owes the admin a code (`?second=1`), and where a link
 * from a mail takes its last step (`?token_hash=`).
 */
export default function SignIn() {
  return <CardScreen><SignInCard /></CardScreen>;
}
