import type { Metadata } from "next";
import { PortfolioCanvas } from "@/components/portfolio-canvas";

export const metadata: Metadata = { title: "Philosophy", description: "How I think about building things." };

export default function PhilosophyPage() {
  return <PortfolioCanvas initialView="philosophy" heading="How Bhargav thinks about building" />;
}
