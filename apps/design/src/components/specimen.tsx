import type { ReactNode } from "react";

/** The column the reading pages sit in. /grid opts out of it and takes the whole viewport. */
export function Reading({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-6 py-10">{children}</div>;
}

/** One component, named, with its live examples in a row that wraps. */
export function Specimen({ name, note, children }: { name: string; note?: string; children: ReactNode }) {
  return (
    <section id={name} className="scroll-mt-20 border-b py-8 last:border-b-0">
      <h3 className="font-heading text-xs font-bold tracking-widest uppercase">{name}</h3>
      {note ? <p className="text-muted-foreground mt-1 text-sm">{note}</p> : null}
      <div className="mt-5 flex flex-wrap items-start gap-5">{children}</div>
    </section>
  );
}

/** The page's own title block. */
export function LayerHeader({ title, count, note }: { title: string; count: number; note: string }) {
  return (
    <div className="border-b pb-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm">{note}</p>
      <p className="text-muted-foreground mt-4 font-mono text-xs">{count} components</p>
    </div>
  );
}
