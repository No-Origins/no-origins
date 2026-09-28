/** User-authored agent motion. Distances are cell units; the body never scales. */
export type AgentTuning = Record<string, number | string>;
export type AgentPose = { x: number; y: number; rotate: number; q: number; leftBlink: number; rightBlink: number };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const agentNumber = (values: AgentTuning, key: string, fallback: number) => {
 const n = Number(values[`--motion-agent-${key}`]); return Number.isFinite(n) ? n : fallback;
};
function ease(p: number, kind: unknown) {
 if (kind === "linear") return p;
 if (kind === "in") return p * p * p;
 if (kind === "out") return 1 - (1-p) ** 3;
 if (kind === "back") { const t = p - 1; return 1 + 2.70158*t*t*t + 1.70158*t*t; }
 return p*p*(3-2*p);
}
export function agentPose(values: AgentTuning, q: number, p = 0): AgentPose {
 const n = (key: string, fallback = 0) => agentNumber(values, key, fallback);
 const mix = (key: string) => n(`start-${key}`) + (n(`end-${key}`)-n(`start-${key}`))*q;
 const wave = Math.sin(Math.PI*p);
 const blink = (offset: number) => 1 - n("blink-depth") * Math.max(0, 1 - Math.abs(p-n("blink-at", .5)-offset)/Math.max(.025,n("blink-width",.2)/2));
 return {x: mix("x") + n("sway")*Math.sin(p*Math.PI*2*n("waves",1))*wave,
 y: mix("y") - n("lift")*wave, rotate: mix("rotation") + n("rock")*wave,
 q, leftBlink: blink(0), rightBlink: blink(n("blink-offset"))};
}
export function agentFrame(values: AgentTuning, t: number, duration: number, hold: number, returning: number, delay: number): AgentPose {
 if (t <= delay) return agentPose(values, 0);
 t -= delay;
 if (t < duration) { const p=clamp(t/duration); return agentPose(values,ease(p,values["--motion-agent-ease"]),p); }
 if (t <= duration+hold) return agentPose(values,1);
 const p=clamp((t-duration-hold)/returning);
 return agentPose(values,1-ease(p,values["--motion-agent-return-ease"]),p === 1 ? 0 : p);
}
