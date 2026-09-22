import type { ReactNode } from "react";

/** The column reading pages sit in. Long teaching content stays comfortable; tours may opt out. */
export function Reading({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-6 py-10">{children}</div>;
}
