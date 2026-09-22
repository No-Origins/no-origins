import type { Metadata } from "next";
import { JidoTour } from "@/components/jido-tour";

export const metadata: Metadata = {
  title: "Jido — layered tour",
  description: "Interactive layered tour of Jido, the BEAM-first autonomous agent framework for Elixir.",
};

export default function JidoLearnPage() {
  return <JidoTour />;
}
