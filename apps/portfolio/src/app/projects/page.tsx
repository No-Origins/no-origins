import type { Metadata } from "next";
import { PortfolioCanvas } from "@/components/portfolio-canvas";

export const metadata: Metadata = { title: "Projects", description: "My own projects. Nothing has shipped yet; this fills as it does." };

export default function ProjectsPage() {
  return <PortfolioCanvas initialView="projects" heading="Bhargav's projects" />;
}
