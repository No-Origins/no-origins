"use client";
import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { RegionLabel } from "../../organisms/RegionLabel";
import type { RegionFlowNode } from "./scene";

/**
 * RegionNode — the titled area behind a column of panels (Design-System.md §8.2). What makes a canvas of
 * fourteen panels a map instead of soup.
 *
 * The label is the *eyebrow* word at map scale — 80px in canvas units, because it is the one heading that has to
 * read at zoom 0.24. It is deliberately `aria-hidden`: the section's real `<h2>` lives in the region's intro panel,
 * where the meaningful title is ("Four roles, told as blocks" beats "work" for anyone navigating by heading).
 *
 * The markup itself is `RegionLabel` (§9), so a region can be authored in a document as well as placed in a scene.
 */
export interface RegionNodeData extends Record<string, unknown> {
  label: string;
}

export const RegionNode = memo(function RegionNode({ data }: NodeProps<RegionFlowNode>) {
  return <RegionLabel>{data.label}</RegionLabel>;
});
