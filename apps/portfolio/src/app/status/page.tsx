import type { Metadata } from "next";
import { PortfolioCanvas } from "@/components/portfolio-canvas";

export const metadata: Metadata = { title: "Current status", description: "What I'm looking for, and four ways to reach me." };

export default function StatusPage() {
  return <PortfolioCanvas initialView="status" heading="What Bhargav is looking for" />;
}
