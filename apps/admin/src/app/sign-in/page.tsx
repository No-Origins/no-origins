import { Grid } from "@no-origins/ui/components/grid";
import { LoginCard } from "@/components/login-card";

export const metadata = { title: "Sign in" };

/**
 * Sign in (Admin.md §8.4) — the login card, centered on the grid.
 *
 * The grid is the brand's ground (Brand.md), so the one public route stands on it: a `Grid` field fills the
 * viewport behind, and the card floats in its centre. This is the one route that renders without the admin
 * shell — there is no shell yet, and there is nothing to navigate to before you are in.
 */
export default function SignIn() {
  return (
    <div className="relative min-h-dvh">
      <Grid overlay className="absolute inset-0" aria-hidden />
      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4">
        <LoginCard />
      </div>
    </div>
  );
}
