"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, MapIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Progress } from "@no-origins/ui/components/progress";
import { cn } from "@no-origins/ui/lib/utils";

import { LAYERS } from "@/lib/jido-meta";
import { renderLayer } from "@/components/jido-layers";

export function JidoTour() {
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));

  const goTo = useCallback((i: number) => {
    if (i < 0 || i >= LAYERS.length) return;
    setIndex(i);
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (index < LAYERS.length - 1) goTo(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (index > 0) goTo(index - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  const meta = LAYERS[index];
  const nextLabel = useMemo(() => {
    if (index === 0) return "Start";
    if (index === LAYERS.length - 1) return "Back to map";
    return "Next";
  }, [index]);

  const stage = renderLayer(index, visited, goTo);

  return (
    <div
      className="mx-auto flex h-[100dvh] max-w-5xl flex-col px-4 pt-4 pb-3 sm:px-6"
      role="application"
      aria-label="Jido layered presentation"
    >
      <header className="mb-3 flex shrink-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{meta.eyebrow}</p>
          <h1 className="font-heading truncate text-xl font-bold tracking-tight sm:text-2xl">{meta.title}</h1>
        </div>
        <div className="w-28 shrink-0 sm:w-36" aria-hidden>
          <Progress value={meta.progress} />
        </div>
        {index !== 0 ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => goTo(0)}>
            <MapIcon data-icon="inline-start" />
            Show map
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Library</Link>
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">{stage}</div>

      <footer className="border-border mt-auto flex shrink-0 items-center justify-between gap-3 border-t pt-3">
        <Button type="button" variant="outline" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <ArrowLeftIcon data-icon="inline-start" />
          Prev
        </Button>
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Layers">
            {LAYERS.map((layer, i) => (
              <button
                key={layer.id}
                type="button"
                role="tab"
                aria-label={i === 0 ? "Map" : `Layer ${i}`}
                aria-selected={i === index}
                onClick={() => goTo(i)}
                className={cn(
                  "border-foreground size-2.5 border",
                  i === index && "bg-foreground",
                  visited.has(i) && i !== index && "bg-muted-foreground/40",
                  !visited.has(i) && i !== index && "bg-transparent",
                )}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-[0.7rem]">← → keys · Map at start</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            if (index === LAYERS.length - 1) goTo(0);
            else goTo(index + 1);
          }}
        >
          {nextLabel}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </footer>
    </div>
  );
}
