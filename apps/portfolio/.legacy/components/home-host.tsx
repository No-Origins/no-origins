"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bubble, ChatInput, Speaker, type ChatSuggestion } from "@no-origins/ui";
import { HOST_CANT_CHAT, HOST_SAYS } from "@/content/host";

/**
 * The host on the home page: the blob that speaks, and the guided chat that answers it.
 *
 * The two sit at opposite ends of the page — the blob under the greeting, the input at the bottom — and they
 * share one line of state, so a word the chat cannot place changes what the blob is saying rather than being
 * swallowed. That is why this is a context and not two independent islands: the alternative was to duplicate the
 * message, and then only one of the two copies would ever be right.
 *
 * Until the agents harness exists the input is GUIDED: four suggestions, and plain words routed to the section
 * they most likely mean. A hit navigates; a miss says why it cannot answer. Both behaviours came off the canvas
 * unchanged when the canvas went (2026-09-16).
 */
const suggestions: ChatSuggestion[] = [
  { label: "Who are you?", value: "/", hue: "peach" },
  { label: "Show me the work", value: "/work", hue: "green" },
  { label: "What are you after?", value: "/status", hue: "blue" },
  { label: "How do you think?", value: "/philosophy", hue: "lavender" },
];

// Until the model in the blob can answer for itself, plain words are routed to the section they most likely mean.
const routes: Array<[RegExp, string]> = [
  [/\b(case|cases|study|studies|neptune|vault|geniq|deep\s*dive)\b/i, "/case-studies"],
  [/\b(project|projects|side|shipped|built\s*your\s*own)\b/i, "/projects"],
  [/\b(work|job|role|roles|résumé|resume|cv|experience|radise|hashnode|dataflix)\b/i, "/work"],
  [/\b(hire|hiring|looking|available|freelance|contact|email|talk|reach|collaborate|connect|hi|hello|hey)\b/i, "/status"],
  [/\b(philosophy|think|believe|principle|principles|approach|why)\b/i, "/philosophy"],
  [/\b(interest|interests|curious|hobby|hobbies|outside|fun)\b/i, "/interests"],
  [/\b(who|you|about|bhargav|yourself|origins?|based|where)\b/i, "/"],
];

interface Host {
  says: string;
  missed: boolean;
  setMissed: (missed: boolean) => void;
}
const HostContext = createContext<Host>({ says: HOST_SAYS, missed: false, setMissed: () => {} });

export function HostProvider({ children }: { children: ReactNode }) {
  const [missed, setMissed] = useState(false);
  return (
    <HostContext.Provider value={{ says: missed ? HOST_CANT_CHAT : HOST_SAYS, missed, setMissed }}>
      {children}
    </HostContext.Provider>
  );
}

/** Bhargav's blob, with whatever it is currently saying. The one blob on the site (Brand.md §9). */
export function HostSpeaker() {
  const { says } = useContext(HostContext);
  return <Speaker label="Bhargav" variant="host" size="lg" say={says} />;
}

export function GuidedChat() {
  const { says, missed, setMissed } = useContext(HostContext);
  const router = useRouter();
  const go = (href: string) => {
    setMissed(false);
    router.push(href);
  };
  const send = (text: string) => {
    const hit = routes.find(([re]) => re.test(text));
    if (hit) go(hit[1]!);
    else setMissed(true);
  };
  return (
    <div className="flex flex-col gap-4">
      {/* The blob is a screen away by the time anyone types down here, so its answer is repeated beside the
          input. One state, two places it can be read — never two messages that can disagree. */}
      {missed ? (
        <Bubble role="status" className="max-w-[52ch]">
          {says}
        </Bubble>
      ) : null}
      <ChatInput suggestions={suggestions} onSend={send} onSuggestion={(s) => go(s.value)} />
    </div>
  );
}
