"use client";

import { Badge } from "@no-origins/ui/components/badge";
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

function Layer4() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SectionLabel>Define an agent</SectionLabel>
          <CodeBlock>{`defmodule MyAgent do
  use Jido.Agent,
    name: "my_agent",
    schema: [
      count: [type: :integer, default: 0]
    ]

  # optional: signal → action routes
  def signal_routes, do: [
    {"counter.inc", IncrementAction}
  ]
end`}</CodeBlock>
        </div>
        <div>
          <SectionLabel>Write an Action</SectionLabel>
          <CodeBlock>{`defmodule IncrementAction do
  use Jido.Action,
    name: "increment",
    schema: []

  def run(_params, ctx) do
    n = Map.get(ctx.state, :count, 0)
    {:ok, %{count: n + 1}}
    # or {:ok, state, directives}
  end
end`}</CodeBlock>
        </div>
      </div>
      <div>
        <SectionLabel>Chain in cmd/2</SectionLabel>
        <CodeBlock>{`{agent, directives} = MyAgent.cmd(agent, [Action1, {Action2, %{x: 1}}])`}</CodeBlock>
      </div>
      <Card>
        <CardContent className="pt-6 text-sm leading-relaxed">
          <strong>Decision rule:</strong> Need the result <em>now</em> to update state → keep I/O in the{" "}
          <strong>Action</strong>. Outbound effect owned by runtime/integration → return a <strong>Directive</strong>.
        </CardContent>
      </Card>
    </div>
  );
}

function Layer5() {
  return (
    <div className="space-y-5">
      <Lede>Instance-scoped OTP — no global singleton. Your app owns a Jido instance under supervision.</Lede>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SectionLabel>Wire the instance</SectionLabel>
          <CodeBlock>{`defmodule MyApp.Jido do
  use Jido, otp_app: :my_app
end

# supervision tree
children = [MyApp.Jido]
Supervisor.start_link(children, strategy: :one_for_one)`}</CodeBlock>
        </div>
        <div>
          <SectionLabel>Lifecycle</SectionLabel>
          <CodeBlock>{`{:ok, pid} = MyApp.Jido.start_agent(MyAgent, id: "a1")
pid = MyApp.Jido.whereis("a1")
{:ok, agent} = Jido.AgentServer.call(pid, signal)
:ok = MyApp.Jido.stop_agent("a1")

# persist briefly
:ok = MyApp.Jido.hibernate(agent)
{:ok, agent} = MyApp.Jido.thaw(MyAgent, "a1")`}</CodeBlock>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test without processes</CardTitle>
            <CardDescription>
              Call <code className="font-mono text-xs">MyAgent.cmd/2</code> directly. Assert on agent state and
              directive structs.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production with AgentServer</CardTitle>
            <CardDescription>
              Signals in, directives drained, supervised children — same agent module.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

function Layer6() {
  const pills = ["ReAct", "CoT", "ToT", "GoT", "TRM", "Adaptive"];
  return (
    <div className="space-y-5">
      <Lede>
        Strategies are the <strong className="text-foreground">how</strong> of execution inside{" "}
        <code className="font-mono text-xs">cmd/2</code>. Core ships Direct + FSM;{" "}
        <code className="font-mono text-xs">jido_ai</code> adds LLM reasoning on the same contract.
      </Lede>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Strategy</TableHead>
            <TableHead>Best for</TableHead>
            <TableHead>Tradeoff</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium whitespace-normal">Direct</TableCell>
            <TableCell className="whitespace-normal">Sequential / request-response, independent actions</TableCell>
            <TableCell className="whitespace-normal">Single-pass; no built-in tick loop</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium whitespace-normal">FSM</TableCell>
            <TableCell className="whitespace-normal">Multi-step workflows, wizards, mode switching</TableCell>
            <TableCell className="whitespace-normal">Explicit transitions; more setup</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div>
        <SectionLabel>Custom strategy</SectionLabel>
        <p className="mb-4 text-sm">
          Implement <code className="font-mono text-xs">Jido.Agent.Strategy</code> — required callback{" "}
          <code className="font-mono text-xs">cmd/3</code>; optional <code className="font-mono text-xs">tick/2</code> for
          multi-turn loops.
        </p>
        <SectionLabel>jido_ai reasoning (same cmd/2)</SectionLabel>
        <div className="mb-4 flex flex-wrap gap-2">
          {pills.map((p) => (
            <Badge key={p} variant="secondary">
              {p}
            </Badge>
          ))}
        </div>
        <SectionLabel>Tools = Jido.Action modules · ask_sync sketch</SectionLabel>
        <CodeBlock>{`use Jido.AI.Agent,
  name: "math_agent",
  model: :fast,
  tools: [MyApp.Actions.AddNumbers]

{:ok, pid} = Jido.AgentServer.start(agent: MyApp.MathAgent)
{:ok, answer} = MyApp.MathAgent.ask_sync(pid, "What is 19 + 23?")`}</CodeBlock>
      </div>
    </div>
  );
}

function Layer7() {
  const pkgs = [
    { title: "jido", body: "Core agents, directives, AgentServer, strategies." },
    { title: "jido_action", body: "Composable validated actions (+ tool conversion)." },
    { title: "jido_signal", body: "CloudEvents envelopes, routing, dispatch." },
    { title: "jido_ai", body: "LLM strategies, ReAct agents, ask/ask_sync." },
    { title: "req_llm", body: "Streaming multi-provider LLM client." },
    { title: "+ ecosystem", body: "ash_jido, behavior trees — light touch extensions." },
  ];
  const multi = [
    { title: "SpawnAgent", body: "Directive to start a child agent under the parent runtime." },
    { title: "Parent → child", body: "Hierarchies with tracked tags; stop/await patterns." },
    { title: "Await", body: "Coordinate on child work without leaving the signal loop." },
  ];
  return (
    <div className="space-y-5">
      <SectionLabel>Package map</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pkgs.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <CardTitle className="text-base">{p.title}</CardTitle>
              <CardDescription>{p.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <SectionLabel>Multi-agent</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-3">
        {multi.map((m) => (
          <Card key={m.title}>
            <CardHeader>
              <CardTitle className="text-base">{m.title}</CardTitle>
              <CardDescription>{m.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle>Harness fit</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Skills → Actions / plugins · Orchestration → parent agents + signals · UI → Phoenix later. Same layered
            model from Map → Layer 7.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <a className="font-medium underline-offset-4 hover:underline" href="https://jido.hexdocs.pm" target="_blank" rel="noopener noreferrer">
            jido.hexdocs.pm
          </a>
          {" · "}
          <a className="font-medium underline-offset-4 hover:underline" href="https://jido.run" target="_blank" rel="noopener noreferrer">
            jido.run
          </a>
          {" · "}
          <a className="font-medium underline-offset-4 hover:underline" href="https://github.com/agentjido" target="_blank" rel="noopener noreferrer">
            github.com/agentjido
          </a>
          {" · Jido ~2.3"}
        </CardContent>
      </Card>
    </div>
  );
}


export { Layer4, Layer5, Layer6, Layer7 };
