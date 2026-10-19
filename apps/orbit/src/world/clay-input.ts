/** Shared input for the keyboard and design-system touch controls. */
export type ClayInput = { action: "bag" | "visor"; open: boolean } | { code: string; pressed: boolean } | { action: "flight" | "reset" | "auto-walk" } | { action: "follow-cursor"; enabled: boolean };
let followCursor = true;
export const followsCursor = () => followCursor;
export const CLAY_INPUT = "orbit:clay-input";
export function sendClayInput(input: ClayInput) {
  if ("action" in input && input.action === "follow-cursor") followCursor = input.enabled;
  window.dispatchEvent(new CustomEvent<ClayInput>(CLAY_INPUT, { detail: input }));
}

export const OPEN_CLAY_BAG = "orbit:open-clay-bag";
