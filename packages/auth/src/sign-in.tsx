import { Grid } from "@no-origins/ui/components/grid";

import { LoginCard } from "./login-card";

/**
 * The sign-in screen (Admin.md §8.4) — the login card, centred on the grid — which every app's `/sign-in` renders.
 *
 * The grid is the brand's ground (Brand.md), so the one public route stands on it: a `Grid` field fills the viewport
 * behind, and the card floats in its centre. It renders without the app's shell: there is nothing to navigate to
 * before you are in.
 */
export function SignInScreen({ app }: { app: string }) {
  return (
    <div className="relative min-h-dvh">
      <Grid overlay className="absolute inset-0" aria-hidden />
      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4">
        <LoginCard app={app} />
      </div>
    </div>
  );
}
