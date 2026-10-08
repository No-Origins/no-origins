import { AuthPages } from "@/components/auth-pages";

/** An address with nothing at it, on the field like every other page. */
export default function NotFound() {
  return <AuthPages title="Nothing here" line="Nothing lives at this address." back={{ href: "/", label: "Your apps" }} items={[]} />;
}
