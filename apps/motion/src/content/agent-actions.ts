import { AGENT_ACTIONS, actionDefaults, actionSettings, type AgentAction } from "@no-origins/ui/lib/agent-actions";
import type { PropertyValues } from "@no-origins/ui/lib/properties";

import type { Family, Values } from "./families";
import { settingToken, stageValue } from "./sphere";

/**
 * **The agents' actions** (Motion.md M24, his, 2026-10-01): *"okay now I need more bounce action so now you add bounce
 * action you add uh, the controls that are needed uh, for bounce and uh, time frame and now I can adjust the bounce play
 * it … once I like it I should be able to publish it … every card on the grid or like every jig uh, becomes a
 * configuration for an action."*
 *
 * The Agents page holds no motion of its own: its head picks one of the actions the package declares
 * (`@no-origins/ui/lib/agent-actions`), and the bench is that action's, a family of its own here (`actionFamily`) so
 * its values are kept apart from every other action's. Its controls are its cards, a group a card; its timeline is its
 * phases, each as long as its controls make it, never dragged (his: "length should follow from the controls"); its
 * stage plays it on the agent the head previews (M23). The motions it held before — the tabs, the rows, the Hop (M19,
 * M20) — went with M24.
 */

const token = (id: string) => `--motion-sphere-${id}`;

/** An action's values as the stage and its jigs hold them: keyed as tokens. */
export const actionStageValues = (values: PropertyValues): Values =>
  Object.fromEntries(Object.entries(values).flatMap(([id, v]) => {
    const value = stageValue(v);
    return value === undefined ? [] : [[token(id), value]];
  }));

/** The stage's values as an action's, keyed by setting id: only the controls it offers, and only those set. */
export const actionValuesOf = (action: AgentAction, values: Values): Record<string, unknown> =>
  Object.fromEntries(actionSettings(action).flatMap((s) => (values[token(s.id)] === undefined ? [] : [[s.id, values[token(s.id)]]])));

/** One action's bench: its controls as the jigs' tokens, a group a card, and its version's values as its one start. */
export function actionFamily(action: AgentAction): Family {
  return {
    id: `action-${action.id}`,
    label: action.label,
    title: action.touches,
    touches: action.touches,
    hint: action.travels ? "Click a cell to send it there, or press Play." : "Click the stage, or press Play.",
    // Not a block of cells: the agent is one, in the nest it sits in.
    block: { columns: 1, rows: 1, max: 1 },
    tokens: action.groups.flatMap((group) => group.settings.map((s) => settingToken(group.label, s))),
    presets: [
      {
        id: "A",
        name: `Version ${action.version}`,
        why: `${action.label} as the package declares it (Motion.md M24): every control at its default.`,
        risk: "Version 1: tuned by him, then the next version.",
        values: actionStageValues(actionDefaults(action)),
      },
    ],
    version: action.version,
    agents: true,
    action: action.id,
  };
}

export const ACTION_FAMILIES: readonly Family[] = AGENT_ACTIONS.map(actionFamily);

/** An action's bench by its id, or the first action's where it has none of that id. */
export const actionFamilyOf = (id: string): Family => ACTION_FAMILIES.find((f) => f.action === id) ?? ACTION_FAMILIES[0]!;

export const AGENTS_FAMILY: Family = {
  id: "motions",
  label: "Agents",
  title: "What the agents do",
  touches: "The agents' actions, each by its name, with its own controls, played on any agent.",
  hint: "Pick an action, tune its controls, and press Play.",
  block: { columns: 1, rows: 1, max: 1 },
  tokens: [],
  presets: [],
  agents: true,
  actions: true,
};
