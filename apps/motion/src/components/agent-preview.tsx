"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { resolveCharacter, type CharacterLook } from "@no-origins/ui/lib/agent-body";
import { AGENT_FACE, type DrawingData } from "@no-origins/ui/lib/agent-face";
import { cn } from "@no-origins/ui/lib/utils";

import { loadAgents, type PreviewAgent } from "@/app/actions";
import type { Values } from "@/content/families";
import { stageValue } from "@/content/sphere";

/**
 * The agent a motion is previewed on (Motion.md M23, his, 2026-10-01: *"you can just give me a drop down to preview
 * different agents it's not that I'm defining motion for a specific agent it's like I can select an agent to see how
 * it's responding"*). A motion is every agent's; this picks who is watched. Each is as Orbit has it now, its draft
 * (`loadAgents`), drawn with the uploads its look wears. It opens on Bali, or on the one picked last in this browser.
 * With no database — no keys, or signed out — there is one agent, the look the code declares, "Default".
 *
 * Its look stands under every value of the stage (`values`): the character and its pose, as `--motion-sphere-*`, a pair's
 * right side set apart as `-right`. A motion's rows go over it.
 */

const DEFAULT: PreviewAgent = { id: "default", name: "Default", look: resolveCharacter({ body: {}, face: {} }), drawings: {} };

/** The agent the select opens on when nothing was picked here before. */
const FIRST = "Bali";

/** Where the last one picked is remembered: a convenience of this browser, never the motion's. */
const KEY = "no-origins-motion-agent";

export type AgentPreviewStatus = "loading" | "ready" | "offline";

type Preview = {
  agents: PreviewAgent[];
  agent: PreviewAgent;
  select: (id: string) => void;
  /** The agent's look as the stage's values. */
  values: Values;
  drawings: Record<string, DrawingData>;
  status: AgentPreviewStatus;
};

const PreviewContext = React.createContext<Preview | null>(null);

/** The agent being previewed, where a family plays on the agents (`agents` on a family); null elsewhere. */
export const useAgentPreview = () => React.useContext(PreviewContext);

/** A look as the stage's values: the body's settings, each worn slot's style and settings, a pair's right side apart, a switch as its word. */
export function lookValues(look: CharacterLook): Values {
  const values: Values = {};
  const put = (id: string, v: unknown) => {
    const value = stageValue(v);
    if (value !== undefined) values[`--motion-sphere-${id}`] = value;
  };
  for (const [id, v] of Object.entries(look.body)) put(id, v);
  for (const slot of AGENT_FACE) {
    const wear = look.face[slot.id];
    if (!wear) continue;
    if (slot.style && wear.style) put(slot.style.id, wear.style);
    for (const [id, v] of Object.entries(wear.values)) put(id, v);
    for (const [id, v] of Object.entries(wear.right ?? {})) put(`${id}-right`, v);
  }
  return values;
}

const remembered = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function AgentPreviewProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = React.useState<PreviewAgent[]>([DEFAULT]);
  const [id, setId] = React.useState(DEFAULT.id);
  const [status, setStatus] = React.useState<AgentPreviewStatus>("loading");

  React.useEffect(() => {
    let live = true;
    loadAgents()
      .then((outcome) => {
        if (!live) return;
        if (!outcome.ok || !outcome.value.length) {
          setStatus("offline");
          return;
        }
        const found = outcome.value;
        const last = remembered();
        setAgents(found);
        setId((found.find((a) => a.id === last) ?? found.find((a) => a.name === FIRST) ?? found[0]!).id);
        setStatus("ready");
      })
      .catch(() => live && setStatus("offline"));
    return () => {
      live = false;
    };
  }, []);

  const select = React.useCallback((next: string) => {
    setId(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // A private window: it opens on Bali next time.
    }
  }, []);

  const agent = agents.find((a) => a.id === id) ?? agents[0]!;
  const value = React.useMemo<Preview>(
    () => ({ agents, agent, select, values: lookValues(agent.look), drawings: agent.drawings, status }),
    [agents, agent, select, status],
  );
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

/** The head's select of the agent previewed, where the preset select stands on other pages. */
export function AgentSelect({ className }: { className?: string }) {
  const preview = useAgentPreview();
  if (!preview) return null;
  return (
    <Select value={preview.agent.id} onValueChange={preview.select} disabled={preview.status === "loading"}>
      <SelectTrigger size="sm" aria-label="Agent" data-agent-preview={preview.status} className={cn("w-full min-w-0", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {preview.agents.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
