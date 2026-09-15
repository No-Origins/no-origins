import { ContrastReport } from "@no-origins/ui/registry";
import { TokenScreen } from "@/components/token-screen";

export const metadata = { title: "Contrast" };

/**
 * The report is the package's own `ContrastReport`, the same component the admin's Design System section renders
 * (Admin.md §5.1) — one measurement, so the two cannot disagree about what a colour scores.
 *
 * It earned its place on the day it was built by finding three pairs below §12's floors. Under R3 the showcase
 * cannot refuse a token, so making a broken floor impossible to miss is the whole of its job.
 */
export default function Contrast() {
  return (
    <TokenScreen slug="contrast">
      <ContrastReport />
    </TokenScreen>
  );
}
