import { useSyncExternalStore } from "react";

const never = () => () => {};

/**
 * Whether this browser can do WebAuthn at all — `null` until it answers. The server renders `null`, so the first
 * client render matches it and hydration never disagrees; the real answer arrives on the next render.
 */
export function useWebAuthn(): boolean | null {
  return useSyncExternalStore<boolean | null>(never, () => !!window.PublicKeyCredential, () => null);
}
