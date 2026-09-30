import { notFound } from "next/navigation";
import { ConceptStudio } from "@/components/concept-studio";

export default async function Page({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  if (concept !== "split" && concept !== "dock" && concept !== "inspector") notFound();
  return <ConceptStudio concept={concept} />;
}
