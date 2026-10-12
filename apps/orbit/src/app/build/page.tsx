import { redirect } from "next/navigation";

/** The builder opens on its first page, the sidebar's first item. */
export default function BuildPage() {
  redirect("/build/environment");
}
