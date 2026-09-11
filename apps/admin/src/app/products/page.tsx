import { Card, Heading, Placeholder, Section, SectionHeader, Stack, Text } from "@no-origins/ui";
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
    <Section>
      <SectionHeader
        level={1}
        label="Product"
        title="Products"
        lead="A product plugs into exactly one system. Nothing in a product knows about a project — it extends the mechanism, and every project built on that mechanism gets it."
      />

      {products?.length ? (
        <Stack gap={16}>
          {products.map((p) => (
            <Card key={p.id}>
              <Stack gap={8}>
                <Heading level={3}>{p.name}</Heading>
                <Text size="small" tone="muted">plugs into {p.system_slug} · v{p.version}</Text>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <Placeholder title="No products yet">
          Layer 3 is last for a reason: a product extends a system, so there is nothing for one to plug into until
          the systems are real. Step 11 — the manifest, the install, and the first actual product.
        </Placeholder>
      )}
    </Section>
  );
}
