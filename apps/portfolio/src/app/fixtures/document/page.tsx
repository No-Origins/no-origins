import type { Metadata } from "next";
import { DocumentCanvas } from "@/components/document-canvas";

export const metadata: Metadata = { title: "The portfolio as a document", robots: { index: false } };

const VIEWS = new Set(["me", "status", "work", "cases", "projects", "interests", "philosophy"]);

/**
 * Admin.md §13 step 6's fixture: the map read from a Scene-Schema document through the adapter, on the real shell,
 * outside the page-mode layout so it can be compared with the hand-written routes like for like
 * (`e2e/document.spec.ts`). `?view=work` opens it where `/work` opens, at reading zoom.
 */
export default async function DocumentFixture({ searchParams }: PageProps<"/fixtures/document">) {
  const { view } = await searchParams;
  const initialView = typeof view === "string" && VIEWS.has(view) ? view : "me";
  return <DocumentCanvas initialView={initialView} />;
}
