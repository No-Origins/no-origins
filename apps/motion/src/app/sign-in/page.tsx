import { SignInScreen } from "@no-origins/auth/sign-in";

export const metadata = { title: "Sign in" };

/** Sign in: the shared login card, centred on the grid, into the one session every no-origins app shares. */
export default function SignIn() {
  return <SignInScreen app="Motion studio" />;
}
