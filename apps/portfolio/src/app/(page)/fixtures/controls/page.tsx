import type { Metadata } from "next";
import { Panel } from "./panel";

export const metadata: Metadata = { title: "Illustration controls", robots: { index: false } };

export default function Controls() {
  return <Panel />;
}
