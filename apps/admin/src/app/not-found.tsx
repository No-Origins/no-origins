import { AdminPages } from "@/components/admin-pages";

/** An address with nothing at it — a role that was deleted, a link mistyped — on the field like every other page. */
export default function NotFound() {
  return <AdminPages title="Nothing here" line="Nothing lives at this address. The way back is home." items={[]} />;
}
