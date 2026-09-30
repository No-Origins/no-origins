import { SignInScreen } from "@no-origins/auth/sign-in";

export const metadata = { title: "Sign in" };

/** Sign in (Admin.md §8.4): the shared login card, centred on the grid, into the one session every app shares. */
export default function SignIn() {
  return <SignInScreen app="Admin" />;
}
