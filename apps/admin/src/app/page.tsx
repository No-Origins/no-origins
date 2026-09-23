import { HomeGrid } from "@/components/home-grid";

export const metadata = { title: "Home" };

/**
 * The admin home (Admin.md §0.5) — the grid of feature cards. This supersedes §4's rail: the control surface
 * renders on the grid, the base layout. Middleware sends anyone unauthenticated to `/sign-in`, so if this renders
 * at all, you are in.
 */
export default function Home() {
  return <HomeGrid />;
}
