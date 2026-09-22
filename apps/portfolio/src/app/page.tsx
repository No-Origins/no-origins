"use client";

import { PortfolioPages } from "@/components/portfolio-pages";
import { SITE } from "@/content/site";

// A client component, like every page on the grid: GridPages measures its box in the browser.
export default function Home() {
  return <PortfolioPages page={SITE} />;
}
