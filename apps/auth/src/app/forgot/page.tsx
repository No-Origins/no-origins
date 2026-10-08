import { ForgotCard } from "@no-origins/auth/cards";

import { CardScreen } from "@/components/card-screen";

export const metadata = { title: "Forgot your password?" };

/** A forgotten password (Admin.md §8.4, step 5): a mail with a link to set a new one, on `/reset`. */
export default function Forgot() {
  return <CardScreen><ForgotCard /></CardScreen>;
}
