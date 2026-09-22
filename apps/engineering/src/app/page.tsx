import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { Badge } from "@no-origins/ui/components/badge";
import { Reading } from "@/components/reading";

const PIECES = [
  {
    href: "/learn/jido",
    title: "Jido — layered tour",
    eyebrow: "First piece",
    note: "Autonomous agent framework for Elixir. Map through seven layers: why Jido, the core loop, building blocks, Agent & Action depth, OTP runtime, strategies & AI, ecosystem fit.",
  },
];

export default function EngineeringIndexPage() {
  return (
    <Reading>
      <div className="space-y-10">
        <div>
          <Badge variant="secondary">Layer A · public</Badge>
          <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight">Engineering</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Bhargav&apos;s engineering publish library — explanations and breakdowns on one public subdomain.
            Layer A ships a static shell and the first piece. Layer B will move pieces into Supabase with MCP
            publish (writers: Bhargav + bots only). No public write UI.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase">Pieces</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {PIECES.map((piece) => (
              <Card key={piece.href}>
                <CardHeader>
                  <p className="text-muted-foreground font-mono text-xs">{piece.eyebrow}</p>
                  <CardTitle>{piece.title}</CardTitle>
                  <CardDescription>{piece.note}</CardDescription>
                </CardHeader>
                <CardContent />
                <CardFooter>
                  <Button asChild size="sm">
                    <Link href={piece.href}>
                      Open tour <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-muted-foreground space-y-2 border-t pt-8 text-sm">
          <p>
            Compose only from <code className="font-mono text-xs">@no-origins/ui</code>. Press{" "}
            <kbd className="font-mono text-xs">d</kbd> to switch theme.
          </p>
        </div>
      </div>
    </Reading>
  );
}
