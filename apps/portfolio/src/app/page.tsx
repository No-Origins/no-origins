import { PortfolioCanvas } from "@/components/portfolio-canvas";

// The front door (Brand.md §8): the origin cluster, fitted. The rest of the portfolio is the map to its right (§8.3).
export default function Home() {
  return <PortfolioCanvas initialView="me" />;
}
