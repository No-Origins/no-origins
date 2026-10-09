import { Studio } from "@/components/studio";
import { listShots, readAssets, readDraft } from "@/data/store";

// The shots are read from disk at each visit: the studio runs on his machine (Cinema-Engine.md E1), and they change as
// the commands run.
export const dynamic = "force-dynamic";

/**
 * The shots' studio (E1): the shots there are, the first one open, and his saved assets. Off the home page until he
 * names it a section (his, 2026-10-09: the assets come first).
 */
export default function Page() {
  const shots = listShots();
  const first = shots[0] ? (readDraft(shots[0].id) ?? null) : null;
  return <Studio shots={shots.map(({ id, title, versions }) => ({ id, title, versions }))} initial={first} assets={readAssets()} />;
}
