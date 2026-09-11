"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInput, ThemeSwitch, type ChatSuggestion } from "@no-origins/ui";
import { CanvasShell, useCanvasNav } from "@no-origins/ui/canvas";
import { HOST_CANT_CHAT, HOST_SAYS, portfolioScene, portfolioThreads, portfolioViews } from "./scene";

/**
 * The portfolio, entirely on the canvas (Design-System.md §8). Every route renders this; only `initialView`
 * differs, so the sections keep real URLs and their own metadata without any of them being a page.
 *
 * Until the agents harness exists the input is guided — four suggestions, and plain words are routed to the
 * region they most likely mean.
 */
const suggestions: ChatSuggestion[] = [
  { label: "Who are you?", value: "me", hue: "peach" },
  { label: "Show me the work", value: "work", hue: "green" },
  { label: "What are you after?", value: "status", hue: "blue" },
  { label: "How do you think?", value: "philosophy", hue: "lavender" },
];

// Until the model in the blob can answer for itself, plain words are routed to the section they most likely mean.
const routes: Array<[RegExp, string]> = [
  [/\b(case|cases|study|studies|neptune|vault|geniq|deep\s*dive)\b/i, "cases"],
  [/\b(project|projects|side|shipped|built\s*your\s*own)\b/i, "projects"],
  [/\b(work|job|role|roles|résumé|resume|cv|experience|radise|hashnode|dataflix)\b/i, "work"],
  [/\b(hire|hiring|looking|available|freelance|contact|email|talk|reach|collaborate|connect|hi|hello|hey)\b/i, "status"],
  [/\b(philosophy|think|believe|principle|principles|approach|why)\b/i, "philosophy"],
  [/\b(interest|interests|curious|hobby|hobbies|outside|fun)\b/i, "interests"],
  [/\b(who|you|about|bhargav|yourself|origins?|based|where)\b/i, "me"],
];

/** The chat lives inside the shell, so it can move the viewport rather than load a document (§8.5). */
function CanvasChat({ onMiss }: { onMiss: () => void }) {
  const nav = useCanvasNav();
  const send = (text: string) => {
    const hit = routes.find(([re]) => re.test(text));
    if (hit && nav) nav.goTo(hit[1]);
    else onMiss();
  };
  return <ChatInput suggestions={suggestions} onSend={send} onSuggestion={(s) => nav?.goTo(String(s.value))} />;
}

export function PortfolioCanvas({ initialView = "me", heading = "Bhargav — No Origins" }: { initialView?: string; heading?: string }) {
  const [hostSays, setHostSays] = useState<string>(HOST_SAYS);
  const router = useRouter();
  const scene = useMemo(() => portfolioScene(hostSays), [hostSays]);

  // Moving inside the canvas rewrites the address; no navigation, no remount (§8.5).
  const onViewChange = useCallback((id: string) => {
    const href = portfolioViews.find((v) => v.id === id)?.href;
    if (href && window.location.pathname !== href) window.history.replaceState(null, "", href);
  }, []);

  return (
    <CanvasShell
      scene={scene}
      views={portfolioViews}
      initialView={initialView}
      onViewChange={onViewChange}
      threads={portfolioThreads}
      onOpen={(href) => router.push(href)}
      heading={heading}
      menuLayout="column"
      trailing={<ThemeSwitch />}
      chat={<CanvasChat onMiss={() => setHostSays(HOST_CANT_CHAT)} />}
    />
  );
}
