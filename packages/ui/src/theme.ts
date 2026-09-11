/**
 * Theme wiring (Design-System.md §2.5, §10). Three states: system (no attribute), or an explicit `data-theme`
 * of "light" / "dark" on <html>, remembered in localStorage under `theme`. No React in this file: a host inlines
 * `themeBootScript` in <head> so an explicit choice never flashes the other theme; `ThemeSwitch` uses the rest.
 */
export type ThemeChoice = "light" | "system" | "dark";
export const THEME_STORAGE_KEY = "theme";

/** Inline in <head>, before any stylesheet paints. Next: `<script dangerouslySetInnerHTML={{ __html: themeBootScript }} />`. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

export function readTheme(): ThemeChoice {
  if (typeof document === "undefined") return "system";
  const t = document.documentElement.getAttribute("data-theme");
  return t === "dark" || t === "light" ? t : "system";
}

export function applyTheme(choice: ThemeChoice): void {
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    /* private mode, blocked storage — the attribute still applies for this page */
  }
  if (choice === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", choice);
}

/** Calls `onChange` whenever <html data-theme> changes — from this tab's switch or any other writer. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
