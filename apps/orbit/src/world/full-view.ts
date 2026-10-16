/**
 * Full view on the World page (World.md W105): the world alone, the sidebar, the card, the compass and the map put away
 * so nothing stands over it. Held for the visit, never kept: leaving the page, or a reload, brings the interface back.
 */
let shown = false;
const listeners = new Set<() => void>();

export const fullView = {
  get: () => shown,
  /** The server's and the first render's: the interface is always there as a page arrives. */
  start: () => false,
  set(next: boolean) {
    if (next === shown) return;
    shown = next;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
