import { redirect } from "next/navigation";

import { Home } from "@/components/home";
import { loadHome, signedIn } from "@/lib/store";

/** The model and its tour (Home.md H3, H9), the house read where it lives (H4, `lib/store.ts`). */
export default async function Page() {
  if (!(await signedIn())) redirect("/sign-in");
  const { house, tour } = await loadHome();
  return <Home house={house} tour={tour} />;
}
