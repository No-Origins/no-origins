import type { Metadata } from "next";

import { EnvironmentPageJig } from "@/components/jigs";

export const metadata: Metadata = { title: "Light and texture" };

/** Light and texture (World.md W23, W73): one page of the Environment, a group of its one atmosphere, seen across the open world. */
export default function Page() {
  return <EnvironmentPageJig page="light" />;
}
