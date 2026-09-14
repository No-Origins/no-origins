import { Chip, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Products" };

/**
 * Products (Admin.md §1, §13 step 11) — layer 3.
 *
 * A product plugs into exactly one system, and the schema says so: `products.system_slug` is a foreign key. The
 * dependency rule — Projects → Systems ← Products — is not a diagram in a document, it is that column.
 */
export default async function Products() {
  const supabase = await supabaseServer();
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, system_slug, version")
    .order("name");

  return (
    <ToolScreen eyebrow="Products" title="All products" meta={<Chip hue="blue">layer 3</Chip>}>
      <SectionHeader
        level={3}
        rhythm={false}
        title="A product plugs into exactly one system"
        lead="Nothing in a product knows about a project — it extends the mechanism, and every project built on that mechanism gets it."
      />
      <Table
        caption="Products"
        captionHidden
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Product" },
          { key: "system_slug", header: "Plugs into", render: (r) => <code>{r.system_slug}</code> },
          { key: "version", header: "Version", align: "num", width: "100px" },
        ]}
        rows={products ?? []}
        empty="No products yet. Layer 3 is last for a reason: a product extends a system, so there is nothing for one to plug into until the systems are real. Step 11."
      />
    </ToolScreen>
  );
}
