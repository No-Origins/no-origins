export type LayerMeta = {
  id: string;
  title: string;
  eyebrow: string;
  progress: number;
};

export const LAYERS: LayerMeta[] = [
  { id: "map", title: "Jido — layered tour", eyebrow: "Map", progress: 0 },
  { id: "l1", title: "Why Jido", eyebrow: "Layer 1 of 7", progress: 14 },
  { id: "l2", title: "The core loop", eyebrow: "Layer 2 of 7", progress: 28 },
  { id: "l3", title: "Five building blocks", eyebrow: "Layer 3 of 7", progress: 42 },
  { id: "l4", title: "Agent & Action depth", eyebrow: "Layer 4 of 7", progress: 57 },
  { id: "l5", title: "Runtime & OTP", eyebrow: "Layer 5 of 7", progress: 71 },
  { id: "l6", title: "Strategies & AI", eyebrow: "Layer 6 of 7", progress: 85 },
  { id: "l7", title: "Ecosystem & harness fit", eyebrow: "Layer 7 of 7", progress: 100 },
];

export const STAIR = [
  { n: 1, name: "Why Jido", blurb: "BEAM bet · Agent vs AgentServer" },
  { n: 2, name: "The core loop", blurb: "Signal → cmd/2 → DirectiveExec" },
  { n: 3, name: "Five building blocks", blurb: "Agent · Action · Directive · Signal · Strategy" },
  { n: 4, name: "Agent & Action depth", blurb: "Schema, run/2, decision rule" },
  { n: 5, name: "Runtime & OTP", blurb: "MyApp.Jido · start_agent · hibernate" },
  { n: 6, name: "Strategies & AI", blurb: "Direct / FSM · jido_ai · ask_sync" },
  { n: 7, name: "Ecosystem & harness", blurb: "Packages · multi-agent · closing" },
] as const;
