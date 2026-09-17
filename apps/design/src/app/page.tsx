import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { Badge } from "@no-origins/ui/components/badge";
import { Reading } from "@/components/specimen";

const LAYERS = [
  {
    href: "/atoms",
    title: "Atoms",
    count: 18,
    note: "The indivisible ones — a control, a piece of text, a mark.",
  },
  {
    href: "/molecules",
    title: "Molecules",
    count: 42,
    note: "Two or more atoms with a job between them.",
  },
  {
    href: "/grid",
    title: "Grid",
    count: 2,
    note: "The base layout — square cells, a field per breakpoint, boxes placed by coordinate.",
  },
];

export default function OverviewPage() {
  return (
    <Reading>
      <div className="space-y-10">
      <div>
        <Badge variant="secondary">v2.0.0</Badge>
        <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight">The design system</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Rebuilt on shadcn/ui — style <code className="font-mono text-xs">radix-sera</code>, base{" "}
          <code className="font-mono text-xs">radix</code>, base colour{" "}
          <code className="font-mono text-xs">neutral</code>, square corners, RTL on. Sixty components live in{" "}
          <code className="font-mono text-xs">@no-origins/ui</code>, plus the theme provider, and every app consumes
          them from source.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LAYERS.map((layer) => (
          <Card key={layer.href}>
            <CardHeader>
              <CardTitle>{layer.title}</CardTitle>
              <CardDescription>{layer.note}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground font-mono text-xs">{layer.count} components</p>
            </CardContent>
            <CardFooter>
              <Button asChild size="sm">
                <Link href={layer.href}>
                  Open <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-muted-foreground space-y-2 border-t pt-8 text-sm">
        <p>
          The grid is the base layout: everything an app lays out snaps onto it. It is being designed now — open{" "}
          <code className="font-mono text-xs">/grid</code>, move the boxes, and tell me what is wrong.
        </p>
        <p>
          Organisms and templates are not here yet. The old ones went with the old system; the new ones get designed on
          top of this layer.
        </p>
        <p>
          Press <kbd className="font-mono text-xs">d</kbd> to switch theme.
        </p>
      </div>
      </div>
    </Reading>
  );
}
