import type { Metadata } from "next";
import { PortfolioCanvas } from "@/components/portfolio-canvas";

export const metadata: Metadata = { title: "Case studies", description: "Chosen pieces of the work, told as problem, approach and outcome." };

export default function CaseStudiesPage() {
  return <PortfolioCanvas initialView="cases" heading="Bhargav's case studies" />;
}
