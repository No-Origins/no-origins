import type { RoadmapItemProps } from "@no-origins/ui";

/** The two blocks in progress (Brand.md §9). Principle 4: visible and unfinished, never "coming soon". */
export const roadmap: Array<Pick<RoadmapItemProps, "hue" | "title" | "description" | "progress">> = [
  {
    hue: "lavender",
    title: "An editor to write and publish",
    description:
      "Not here yet. Here's what it'll do: write articles in a WYSIWYG editor and publish them on No Origins. I've built two editors on tiptap for other people. This one is mine.",
    progress: "after the portfolio · designing",
  },
  {
    hue: "blue",
    title: "A cloud agents harness",
    description:
      "Not here yet. Here's what it'll do: agents as characters on a canvas, each with a job. You talk to the platform through one input and watch them work. It is the block this whole site is a front door for.",
    progress: "after the editor · concept",
  },
];
