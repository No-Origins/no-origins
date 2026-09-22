"use client";

import { ArrowRightIcon } from "lucide-react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@no-origins/ui/components/table";
import { cn } from "@no-origins/ui/lib/utils";

import { STAIR } from "@/lib/jido-meta";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-foreground text-background overflow-x-auto rounded-none border p-4 font-mono text-xs leading-relaxed whitespace-pre">
      <code>{children}</code>
    </pre>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-2 text-xs font-bold tracking-widest uppercase">{children}</p>
  );
}

function Lede({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-muted-foreground mb-5 max-w-3xl text-base leading-relaxed", className)}>{children}</p>;
}

function MapLayer({
  index,
  visited,
  onJump,
  onStart,
}: {
  index: number;
  visited: Set<number>;
  onJump: (i: number) => void;
  onStart: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Lede>Autonomous agent framework for Elixir. Ordinary BEAM software — not an LLM wrapper.</Lede>
        <Badge className="font-mono text-xs">Signal → Action → cmd/2 → {"{agent, directives}"} → runtime</Badge>
      </div>

      <div className="flex max-w-xl flex-col gap-2" role="list">
        {STAIR.map((s, i) => {
          const layerIndex = i + 1;
          const isCurrent = layerIndex === index;
          const isVisited = visited.has(layerIndex);
          return (
            <button
              key={s.n}
              type="button"
              role="listitem"
              onClick={() => onJump(layerIndex)}
              className={cn(
                "border-border bg-card hover:bg-accent flex w-full items-stretch border text-start transition-transform",
                "md:ms-[calc(var(--stair)*1.5rem)]",
                isCurrent && "bg-accent shadow-[4px_4px_0_0_var(--foreground)]",
                isVisited && !isCurrent && "bg-muted",
                !isVisited && !isCurrent && "opacity-55",
              )}
              style={{ ["--stair" as string]: String(i) }}
            >
              <div className="border-border font-heading flex w-12 shrink-0 items-center justify-center border-e text-lg font-bold">
                {s.n}
              </div>
              <div className="px-4 py-3">
                <strong className="block text-sm">{s.name}</strong>
                <span className="text-muted-foreground text-xs">{s.blurb}</span>
              </div>
            </button>
          );
        })}
      </div>

      <Button onClick={onStart}>
        Start Layer 1 <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}

function Layer1() {
  return (
    <div className="space-y-5">
      <Lede>
        Jido bets on the BEAM: concurrent agents as ordinary Elixir — Elm/Redux-style pure core + OTP runtime. AI is an
        extension (strategies), not a separate world.
      </Lede>
      <ul className="grid gap-2">
        {[
          { n: "01", title: "BEAM-first.", body: "Processes, supervision, and message passing are the agent runtime you already know." },
          { n: "02", title: "Agents are software.", body: "Schema, actions, tests — same tools as any Elixir app." },
          { n: "03", title: "Pure core + OTP shell.", body: "Decision logic stays testable; the GenServer owns effects." },
          { n: "04", title: "AI is optional.", body: "Strategies plug into the same cmd/2 contract when you need LLMs." },
        ].map((item) => (
          <li key={item.n} className="border-border bg-card flex gap-3 border px-4 py-3 text-sm">
            <span className="font-heading shrink-0 text-base font-bold">{item.n}</span>
            <span>
              <strong>{item.title}</strong> {item.body}
            </span>
          </li>
        ))}
      </ul>
      <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
        <Card>
          <CardHeader>
            <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Data</p>
            <CardTitle>Agent</CardTitle>
            <CardDescription>
              Immutable struct + module. Schema, <code className="font-mono text-xs">cmd/2</code>, pure decision logic.
              No mailbox inside.
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="font-heading flex items-center justify-center text-lg font-bold">vs</div>
        <Card>
          <CardHeader>
            <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Process</p>
            <CardTitle>AgentServer</CardTitle>
            <CardDescription>
              GenServer that holds the agent, routes signals, runs <code className="font-mono text-xs">cmd/2</code>,
              executes directives.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      <p className="text-muted-foreground text-sm">
        Why this fits a harness: skills become actions/plugins; orchestration becomes parent agents + signals; the UI
        can be Phoenix later — same mental model.
      </p>
    </div>
  );
}

function Layer2() {
  const steps = [
    { label: "1 · Arrival", title: "Signal", body: "CloudEvents message hits AgentServer via call/3 or cast/2." },
    { label: "2 · Route", title: "AgentServer", body: "Maps signal → action using strategy, agent, and plugin routes." },
    { label: "3 · Decide", title: "Agent.cmd/2", body: "Pure. Same inputs → same outputs. Returns new agent + directives." },
    { label: "4 · Act", title: "DirectiveExec", body: "Runtime drain loop: emit, spawn, schedule, stop — never inside the agent struct." },
  ];
  return (
    <div className="space-y-5">
      <Lede>
        One sentence: <strong className="text-foreground">Signal → Action → cmd/2 → {"{agent, directives}"} → runtime executes directives.</strong>
      </Lede>
      <div className="flex flex-wrap items-stretch gap-2" role="list">
        {steps.map((s, i) => (
          <div key={s.title} className="contents">
            <Card className="min-w-[9rem] flex-1" role="listitem">
              <CardHeader className="gap-1">
                <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{s.label}</p>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <CardDescription className="text-xs">{s.body}</CardDescription>
              </CardHeader>
            </Card>
            {i < steps.length - 1 ? (
              <div className="text-muted-foreground hidden items-center self-center text-xl font-bold md:flex" aria-hidden>
                →
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Purity of cmd/2</CardTitle>
          <CardDescription>
            Returned agent is always complete — no “apply directives” step. Directives never mutate state. Test decisions
            without starting a process.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function Layer3() {
  const blocks = [
    { title: "Agent", body: "Immutable struct + schema. Owns cmd/2." },
    { title: "Action", body: "Transforms state; may do I/O when it needs the result now." },
    { title: "Directive", body: "Outbound effect as data for the runtime. Never changes state." },
    { title: "Signal", body: "CloudEvents envelope into the system (jido_signal)." },
    { title: "Strategy", body: "How actions run in cmd/2 — Direct, FSM, AI, custom." },
  ];
  return (
    <div className="space-y-5">
      <SectionLabel>Five building blocks</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {blocks.map((b) => (
          <Card key={b.title}>
            <CardHeader>
              <CardTitle className="text-base">{b.title}</CardTitle>
              <CardDescription className="text-xs">{b.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <SectionLabel>Actions vs Directives vs StateOps</SectionLabel>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Purpose</TableHead>
            <TableHead>Who executes</TableHead>
            <TableHead>Side effects?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium whitespace-normal">Actions</TableCell>
            <TableCell className="whitespace-normal">Transform agent state; optionally gather results</TableCell>
            <TableCell className="font-mono text-xs whitespace-normal">cmd/2 (in-process)</TableCell>
            <TableCell className="whitespace-normal">May — when result needed now</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium whitespace-normal">Directives</TableCell>
            <TableCell className="whitespace-normal">Describe outbound effects (emit, spawn, schedule…)</TableCell>
            <TableCell className="font-mono text-xs whitespace-normal">AgentServer / DirectiveExec</TableCell>
            <TableCell className="whitespace-normal">Yes — owned by runtime</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium whitespace-normal">StateOps</TableCell>
            <TableCell className="whitespace-normal">Direct state setters / validation helpers</TableCell>
            <TableCell className="font-mono text-xs whitespace-normal">Agent API (set/2, etc.)</TableCell>
            <TableCell className="whitespace-normal">No — pure data updates</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}


export { MapLayer, Layer1, Layer2, Layer3 };
