import type { Metadata } from "next";

import { HiddenstackStudio } from "@/components/hiddenstack-studio";

export const metadata: Metadata = {
  title: "Hiddenstack",
  description: "Hiddenstack's 3D character: a full-body skeleton, joint controls and walk and run studies.",
};

export default function Page() {
  return <HiddenstackStudio />;
}
