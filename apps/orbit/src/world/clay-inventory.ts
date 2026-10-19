/** Browser-local possessions shared by every future zone; no invented starter items. */
export type ClayItem = { id: string; name: string; description: string; zone: string; quantity: number };
const KEY = "orbit:clay-bag:v1";
const CHANGE = "orbit:clay-bag-changed";
let cachedRaw: string | null | undefined;
let cachedItems: readonly ClayItem[] = [];
const empty: readonly ClayItem[] = [];
export const serverInventory = () => empty;
export function readInventory(): readonly ClayItem[] {
  let raw: string | null;
  try { raw = localStorage.getItem(KEY); } catch { return cachedItems; }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const data: unknown = JSON.parse(raw ?? "[]");
    cachedItems = Array.isArray(data) ? data.filter((item): item is ClayItem => !!item && typeof item.id === "string" && typeof item.name === "string" && typeof item.description === "string" && typeof item.zone === "string" && Number.isSafeInteger(item.quantity) && item.quantity > 0) : [];
  } catch { cachedItems = []; }
  return cachedItems;
}
export function subscribeInventory(notify: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) notify(); };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGE, notify);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(CHANGE, notify); };
}
/** Future collection interactions call this once an item is actually acquired. */
export function collectClayItem(item: ClayItem): boolean {
  if (!item.id || !item.name || !Number.isSafeInteger(item.quantity) || item.quantity < 1) return false;
  const items = readInventory();
  const existing = items.find(entry => entry.id === item.id);
  const quantity = (existing?.quantity ?? 0) + item.quantity;
  if (!Number.isSafeInteger(quantity)) return false;
  const next = existing ? items.map(entry => entry.id === item.id ? { ...entry, quantity } : entry) : [...items, { ...item }];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { return false; }
  window.dispatchEvent(new Event(CHANGE));
  return true;
}
