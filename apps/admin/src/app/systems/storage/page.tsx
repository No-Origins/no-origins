import { Chip, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Storage" };

const BUCKETS = [
  { bucket: "assets", access: "private", holds: "Uploads: the résumé PDF, source photographs, anything a panel links. alt, width and height are columns on the record, so a document can reserve the box before the picture arrives." },
  { bucket: "publish", access: "public read", holds: "The published doc JSON per version, at a stable path, plus derived static output. Output is fetched without credentials; the tables have no anon policy anywhere, which is the rule this does not break." },
];

/** Systems → Storage (Admin.md §8.2) — the two buckets and what is in them. */
export default async function Storage() {
  const supabase = await supabaseServer();
  const { data: assets } = await supabase
    .from("assets")
    .select("id, bucket, path, mime, bytes, alt, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <ToolScreen eyebrow="Systems" title="Storage" meta={<Chip hue="grey">{assets?.length ?? 0} files</Chip>}>
      <SectionHeader
        level={3}
        rhythm={false}
        title="Two buckets"
        lead="The difference between them is the whole point: one is private and read through signed URLs, the other is the pipeline's output and is meant to be fetched without credentials."
      />
      <Table
        caption="Buckets"
        captionHidden
        rowKey={(r) => r.bucket}
        columns={[
          { key: "bucket", header: "Bucket", width: "120px", render: (r) => <code>{r.bucket}</code> },
          { key: "access", header: "Access", width: "140px", render: (r) => <Chip hue={r.access === "private" ? "grey" : "green"}>{r.access}</Chip> },
          { key: "holds", header: "What it holds" },
        ]}
        rows={BUCKETS}
      />
      <SectionHeader level={3} rhythm={false} title="Files" lead="The twenty most recent." />
      <Table
        caption="Files"
        captionHidden
        density="compact"
        rowKey={(r) => r.id}
        columns={[
          { key: "path", header: "Path", render: (r) => <code>{r.bucket}/{r.path}</code> },
          { key: "mime", header: "Type" },
          { key: "bytes", header: "Size", align: "num", render: (r) => `${Math.round(r.bytes / 1024)} kB` },
          { key: "created_at", header: "Added", align: "num", render: (r) => String(r.created_at).slice(0, 10) },
        ]}
        rows={assets ?? []}
        empty="Nothing uploaded yet. Both buckets exist and both have their policies; the first file arrives when something in the admin authors a document."
      />
    </ToolScreen>
  );
}
