"use client";

import * as React from "react";
import { ArrowUpRightIcon, MessageCircleIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";

import { icon } from "@/components/profile-card";
import { ORBIT_URL } from "@/content/resume";

/** An agent's name as it is said: its id with a capital (Agents.md: Bali, Zaza, Oru, Kino, Mira, Lola). */
export const agentName = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

/**
 * How long the pill stays once the pointer has left the agent and the pill, ms: the time to cross the gutter between
 * them, so it is not lost on the way. Mine.
 */
const HOVER_CLOSE_MS = 200;

const inPill = (el: EventTarget | null) => el instanceof Element && !!el.closest("[data-agent-pill], [data-agent-spot]");

/**
 * The pill opens by HOVER (his, 2026-10-03: "instead of clicking the agent to open up its information I think uh, let's
 * show it with hover"; it opened by a click until then): a mouse or a pen on the agent opens it, and it stays while the
 * pointer is on the agent or the pill, going HOVER_CLOSE_MS after it has left both. What has no hover keeps a way in: a
 * tap opens and closes it, and the keys' focus on the agent opens it, Enter toggling it. `spot` goes on the agent's
 * cell, `pill` on the pill's. `onPress`, each press of the agent however it comes — the bounce (his, 2026-10-03: "When
 * we click on the agent, add bounce").
 */
export function useAgentPill(onPress?: () => void) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  // How the last press came: a click after a mouse's keeps the pill, after a finger's or the keys' toggles it.
  const pressed = React.useRef("");
  // Focus handed back to the agent by Escape, which must not open the pill it has just closed.
  const quiet = React.useRef(false);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const press = React.useRef(onPress);
  React.useEffect(() => {
    press.current = onPress;
  }, [onPress]);
  return React.useMemo(() => {
    const show = () => {
      window.clearTimeout(timer.current);
      setOpen(true);
    };
    const hide = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
    };
    const close = () => {
      window.clearTimeout(timer.current);
      setOpen(false);
    };
    // Escape: closed, and the keys back on the agent.
    const dismiss = () => {
      close();
      quiet.current = true;
      document.querySelector<HTMLElement>("[data-agent-spot]")?.focus();
      quiet.current = false;
    };
    const hovers = (e: React.PointerEvent) => e.pointerType === "mouse" || e.pointerType === "pen";
    const both = {
      onPointerEnter: (e: React.PointerEvent) => void (hovers(e) && show()),
      onPointerLeave: (e: React.PointerEvent) => void (hovers(e) && hide()),
      onBlur: (e: React.FocusEvent) => void (!inPill(e.relatedTarget) && hide()),
    };
    const spot = {
      ...both,
      onPointerDown: (e: React.PointerEvent) => void (pressed.current = e.pointerType),
      onFocus: (e: React.FocusEvent) => void (!quiet.current && e.target.matches(":focus-visible") && show()),
      onClick: () => {
        press.current?.();
        const by = pressed.current;
        pressed.current = "";
        if (by === "mouse" || by === "pen") show();
        else {
          window.clearTimeout(timer.current);
          setOpen((was) => !was);
        }
      },
    };
    return { open, close, dismiss, spot, pill: both };
  }, [open]);
}

/**
 * The agent of the page, to hover (Portfolio.md P24). The agent itself is the grid's drawing, over this and taking no
 * pointer, so this is what the pointer, a finger, the keys and a screen reader find in its cell: a circle the cell's
 * size, nothing of its own to see.
 */
export function AgentSpot({ id, open, controls }: { id: string; open: boolean; controls: string }) {
  return (
    <Button
      variant="ghost"
      data-agent-spot={id}
      aria-label={agentName(id)}
      aria-expanded={open}
      aria-controls={controls}
      className="size-full p-0"
    />
  );
}

/**
 * An agent at home, to click (his, 2026-10-03: "I should be able to travel to pages by clicking on the agent on the
 * right column"): the way to its page. As the spot, a circle the cell's size under the grid's drawing with nothing of
 * its own to see, lit as a ghost button is under the pointer; its page and its name for a screen reader.
 */
export function AgentHome({ id, title, onClick }: { id: string; title: string; onClick: () => void }) {
  return <Button variant="ghost" data-agent-home={id} aria-label={`${title}, ${agentName(id)}'s page`} className="size-full p-0" onClick={onClick} />;
}

/**
 * What the agent opens (his, 2026-10-03: "a pill of three cells which has name of the agent a chat icon
 * button to chat with it and uh, 45 degree arrow that link icon in the icon button to open up a new page in a new tab
 * it should open orbit application"): one pill, a cell each — its name, a chat button and ↗ to Orbit in a new tab.
 * Each sits on its own cell of the field, so the three line up with the cells around them. **The chat is drawn and
 * does nothing yet**: there is no chat to open (his to build).
 */
export function AgentPill({ id, domId }: { id: string; domId: string }) {
  const m = useGridMetrics();
  const name = agentName(id);
  return (
    <Card
      id={domId}
      size="sm"
      data-agent-pill={id}
      className="relative size-full p-0 motion-surface animate-in fade-in-0 zoom-in-(--motion-surface-scale)"
    >
      {/* Over the card's border, so each third is a cell of the field and the gutters between them its gutters. */}
      <div
        className="absolute -inset-px grid items-center justify-items-center"
        style={{ gridTemplateColumns: m ? `repeat(3, ${m.cell}px)` : "repeat(3, 1fr)", columnGap: m?.gap ?? 0 }}
      >
        {/* A little bold (his, 2026-10-03: "Make the name of the agent a little bold"): semibold, a step over medium. */}
        <Text as="span" className="font-semibold">
          {name}
        </Text>
        <Button variant="ghost" size="icon" disabled aria-label={`Chat with ${name} (not yet)`}>
          <MessageCircleIcon aria-hidden style={icon} />
        </Button>
        <Button asChild variant="ghost" size="icon">
          <a href={ORBIT_URL} target="_blank" rel="noreferrer" aria-label={`${name} in Orbit, in a new tab`}>
            <ArrowUpRightIcon aria-hidden style={icon} />
          </a>
        </Button>
      </div>
    </Card>
  );
}
