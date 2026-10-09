"use client";

import * as React from "react";

import { docCard, docTitle } from "@/components/doc-blocks";
import { SpecimenPages } from "@/components/specimen";
import type { PageContent, SpecimenItem } from "@/content";
import { WRITTEN } from "@/content/pages";
import { findDoc, type DocEntry } from "@/content/sitemap";

/**
 * A page of the sitemap: its written content where there is some (`content/pages`), else, until it is written, where it
 * sits, its title, its purpose — what it should cover — and what every page of its group shows. Each is a box on the
 * grid, as tall as its text in whole cells.
 */
export function DocPageView({ groupId, pageSlug }: { groupId: string; pageSlug: string }) {
  const entry = findDoc(groupId, pageSlug);
  const content = React.useMemo(() => (entry ? (WRITTEN[entry.href]?.(entry) ?? docContent(entry)) : null), [entry]);
  return content ? <SpecimenPages content={content} /> : null;
}

/** A page not written yet: its purpose, its notes, and what every page of its group shows. */
function docContent(entry: DocEntry): PageContent {
  const { group, page } = entry;
  const items: SpecimenItem[] = [
    docTitle(entry),
    docCard("purpose", "Purpose", page.purpose, []),
  ];
  if (page.notes?.length) items.push(docCard("notes", "On this page", undefined, page.notes));
  if (group.brief) items.push(docCard("brief", `Every page in ${group.title}`, group.brief.lead, group.brief.points ?? []));
  return { title: page.title, variant: "card", sections: [{ id: `${group.id}-${page.slug}`, items }] };
}
