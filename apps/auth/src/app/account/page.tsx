import { supabaseEnv } from "@no-origins/auth/env";

import { AccountView } from "@/components/account";
import { NoKeysPage } from "@/components/no-keys";
import { signedIn } from "@/lib/account";

export const metadata = { title: "Your account" };

/**
 * The account (Admin.md §8.4 step 5; Access.md A2): password, passkeys, authenticator apps and deleting the account.
 * The gate lets nobody here who is not signed in.
 */
export default async function AccountPage() {
  if (!supabaseEnv()) return <NoKeysPage title="Your account" line="Your password, your passkeys and your authenticator apps." />;
  const me = await signedIn();
  return <AccountView email={me?.email ?? "Unknown account"} roles={me?.roles ?? []} owner={me?.owner ?? false} />;
}
