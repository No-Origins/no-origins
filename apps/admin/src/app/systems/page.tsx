import Link from "next/link";
import { Card, Heading, Section, SectionHeader, Stack, Text } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Systems" };

export default async function Systems() {
  const supabase = await supabaseServer();
  const { data: systems } = await supabase.from("systems").select("slug, name, kind, description").order("slug");

  return (
    <Section>
      <SectionHeader
        level={1}
        label="System"
        title="Systems"
        lead="The mechanisms a project is built with. A system knows nothing about any project — that is what keeps the dependency arrow pointing one way, and it is why these are listed on their own rather than inside the portfolio."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {(systems ?? []).map((system) => (
          <Card key={system.slug} as={Link} href={`/systems/${system.slug}`} interactive>
            <Stack gap={8}>
              <Heading level={3}>{system.name}</Heading>
              <Text size="small" tone="muted">{system.description}</Text>
            </Stack>
          </Card>
        ))}
      </div>
    </Section>
  );
}
