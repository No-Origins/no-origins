import type { ReactNode } from "react";
import { BlockCard, type BlockCardProps } from "./BlockCard";

/**
 * @deprecated Merged into `BlockCard` (Atomic.md D3, 2026-09-14): `<RoadmapItem description>` is
 * `<BlockCard state="sleep" line>`. This alias goes with the next minor release.
 */
export interface RoadmapItemProps extends Omit<BlockCardProps, "line" | "state" | "meta" | "details" | "chips" | "href"> {
  description: ReactNode;
}

/** @deprecated Use `<BlockCard state="sleep" line={…} progress={…}>`. */
export function RoadmapItem({ description, ...rest }: RoadmapItemProps) {
  return <BlockCard state="sleep" line={description} {...rest} />;
}
