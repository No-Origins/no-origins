import type { Metadata } from "next";
import { PortfolioCanvas } from "@/components/portfolio-canvas";

export const metadata: Metadata = { title: "Interests", description: "What I'm curious about outside the work." };

export default function InterestsPage() {
  return <PortfolioCanvas initialView="interests" heading="Bhargav's interests" />;
}
