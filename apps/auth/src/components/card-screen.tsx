import { Grid } from "@no-origins/ui/components/grid";

/**
 * A card of the login, centred on the grid — the screen every sign-in has had (`@no-origins/auth/sign-in`): a `Grid`
 * field fills the viewport behind, and the card floats in its centre. Nothing to navigate to before you are in.
 */
export function CardScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <Grid overlay className="absolute inset-0" aria-hidden />
      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4">{children}</div>
    </div>
  );
}
