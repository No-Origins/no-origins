import type { Metadata } from "next";
import { PortfolioCanvas } from "@/components/portfolio-canvas";

export const metadata: Metadata = {
  title: "Work",
  description: "Four roles, told as blocks: editors, design systems, agent systems, and shipping full-stack.",
};

export default function WorkPage() {
  return <PortfolioCanvas initialView="work" heading="Bhargav's work experience" />;
}
