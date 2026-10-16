import { redirect } from "next/navigation";

/** The builder opens on the World, the sidebar's first item, where the elements are placed (World.md W73). */
export default function BuildPage() {
  redirect("/build/world");
}
