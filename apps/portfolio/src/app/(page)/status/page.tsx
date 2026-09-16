import type { Metadata } from "next";
import { Button, Card, Placeholder, Section, SectionHeader, Text } from "@no-origins/ui";
import { SampleTag } from "@/components/sample-tag";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Current status", description: "What I'm looking for, and four ways to reach me." };

/**
 * Brand.md §3: no single call to action. Each path is visible; the visitor picks. A button appears only when its
 * destination exists in `content/site.ts`, so an unfilled slot leaves a card with words and no dead control.
 */
function ContactPaths() {
  const { email, github, linkedin, x } = site.contact;
  const mail = email ? `mailto:${email}` : undefined;
  const path = (label: string, title: string, line: string, action: React.ReactNode) => (
    <Card padding="sm">
      <div className="flex h-full flex-col gap-2">
        <p className="noo-label text-muted">{label}</p>
        <p className="noo-h4 text-ink">{title}</p>
        <Text size="small" tone="muted">{line}</Text>
        {action ? <div className="mt-auto flex flex-wrap gap-2 pt-3">{action}</div> : null}
      </div>
    </Card>
  );
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {path("hiring", "Recognise the work", "Four roles, told as blocks, with the résumé as a download. Then tell me what you're building.", (
        <>
          <Button variant="secondary" size="sm" href="/work">See the work</Button>
          {mail ? <Button size="sm" href={mail}>Email me</Button> : null}
        </>
      ))}
      {path("collaborating", "Bring an idea", "Work, a tool a friend needs, a block that should exist. Curiosity is the whole point of this place.", mail ? <Button size="sm" href={mail}>Tell me about it</Button> : null)}
      {path("following", "Watch the blocks land", "This grows as I ship. Come back.", github || linkedin || x ? (
        <>
          {github ? <Button variant="secondary" size="sm" href={github} rel="me">GitHub</Button> : null}
          {linkedin ? <Button variant="secondary" size="sm" href={linkedin} rel="me">LinkedIn</Button> : null}
          {x ? <Button variant="secondary" size="sm" href={x} rel="me">X</Button> : null}
        </>
      ) : null)}
      {path("saying hi", "No agenda needed", "If you just want to say you were here, that counts too.", mail ? <Button variant="ghost" size="sm" href={mail}>Say hi</Button> : null)}
    </div>
  );
}

export default function StatusPage() {
  return (
    <>
      <Section aria-labelledby="status-title">
        <SectionHeader level={1} title="What I'm looking for" titleId="status-title" />
        {site.status ? (
          <div className="flex flex-col gap-3">
            <SampleTag of="status" />
            <Text size="lead" className="max-w-[60ch]">{site.status}</Text>
          </div>
        ) : (
          <Placeholder draft title="Not written yet">
            A sentence or two in Bhargav&apos;s words: the kind of role or work he wants next, and whether he&apos;s open to
            freelance or collaborating.
          </Placeholder>
        )}
      </Section>

      <Section aria-labelledby="paths-title">
        <SectionHeader title="Four ways to get in touch" titleId="paths-title" />
        <ContactPaths />
      </Section>
    </>
  );
}
