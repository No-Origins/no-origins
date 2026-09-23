"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@no-origins/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@no-origins/ui/components/alert-dialog";
import { Field, FieldError, FieldLabel } from "@no-origins/ui/components/field";
import { Input } from "@no-origins/ui/components/input";
import { GridEditor } from "@no-origins/ui/components/grid-editor";
import { findFreeRect, type GridLayout, type GridLayoutItem, type GridPage } from "@no-origins/ui/lib/grid-layout";

import { createQuest, deleteQuest, type CreateResult } from "@/app/quests/actions";
import type { Quest } from "@/lib/quests";

/**
 * The quests dashboard (Admin.md §0.5): every quest a card on the grid. The **first row is an action bar** —
 * Create, and the home for future quest-feature actions — and the quest cards pack beneath it from the second row,
 * three columns by two rows each. Read-only field; opening and composing a quest is what you do, not arranging it.
 */

const COLS = 12;
const ROWS = 6;
const CARD_W = 3;
const CARD_H = 2;
const ACTIONS = "__actions__";

/** Reserve row 1 for the action bar and both bottom corners for the pager, then pack the 3×2 cards into what's left. */
function buildLayout(quests: Quest[]): GridLayout {
  const reserved = [
    { col: 1, row: 1, colSpan: COLS, rowSpan: 1 }, // the action bar
    { col: 1, row: ROWS, colSpan: 1, rowSpan: 1 }, // ‹ pager
    { col: COLS, row: ROWS, colSpan: 1, rowSpan: 1 }, // › pager
  ];

  const pages: GridPage[] = [];
  const queue = [...quests];
  let index = 0;
  do {
    const bar: GridLayoutItem = { id: ACTIONS, col: 1, row: 1, colSpan: COLS, rowSpan: 1 };
    const cards: GridLayoutItem[] = [];
    while (queue.length) {
      const rect = findFreeRect(cards, COLS, ROWS, CARD_W, CARD_H, reserved);
      if (!rect) break;
      const quest = queue.shift()!;
      cards.push({ id: quest.slug, label: quest.name, ...rect });
    }
    pages.push({ id: `quests-${index++}`, items: [bar, ...cards] });
  } while (queue.length);

  return { shapes: { lg: { cols: COLS, rows: ROWS } }, authored: { lg: pages } };
}

export function QuestsGrid({ quests, canDelete }: { quests: Quest[]; canDelete: boolean }) {
  const router = useRouter();
  const [page, setPage] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Quest | null>(null);

  const bySlug = React.useMemo(() => new Map(quests.map((q) => [q.slug, q])), [quests]);
  const layout = React.useMemo(() => buildLayout(quests), [quests]);

  return (
    <div className="h-dvh">
      <GridEditor
        layout={layout}
        onLayoutChange={() => {}}
        page={page}
        onPageChange={setPage}
        readOnly
        overlay
        className="h-full"
        renderItem={(item) =>
          item.id === ACTIONS ? (
            <ActionsBar count={quests.length} onCreate={() => setCreateOpen(true)} />
          ) : (
            <QuestCard quest={bySlug.get(item.id)} canDelete={canDelete} onDelete={(q) => setPendingDelete(q)} />
          )
        }
      />

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(slug) => router.push(`/quests/${slug}`)} />

      <DeleteDialog
        quest={pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onDeleted={() => {
          setPendingDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}

/** The first row: the feature's title, count, and its actions. Transparent so it reads as controls on the grid. */
function ActionsBar({ count, onCreate }: { count: number; onCreate: () => void }) {
  return (
    <div className="flex h-full w-full items-center gap-3 px-1">
      <span className="font-mono text-xs tracking-wide uppercase">Quests</span>
      <Badge variant="secondary" className="font-mono text-[10px]">
        {count}
      </Badge>
      <div className="ms-auto flex items-center gap-2">
        <Button onClick={onCreate}>
          <PlusIcon /> Create quest
        </Button>
      </div>
    </div>
  );
}

function QuestCard({
  quest,
  canDelete,
  onDelete,
}: {
  quest: Quest | undefined;
  canDelete: boolean;
  onDelete: (quest: Quest) => void;
}) {
  if (!quest) return null;
  return (
    <div className="relative h-full w-full">
      <Link
        href={`/quests/${quest.slug}`}
        className="bg-card group hover:border-foreground focus-visible:ring-ring flex h-full w-full flex-col justify-between border p-4 transition-colors outline-none focus-visible:ring-2"
      >
        <Badge variant={quest.status === "live" ? "default" : "outline"} className="font-mono text-[10px] tracking-wide uppercase">
          {quest.status}
        </Badge>
        <div className="space-y-1">
          <h2 className="font-heading text-lg leading-tight font-semibold">{quest.name}</h2>
          {quest.description ? <p className="text-muted-foreground line-clamp-2 text-sm">{quest.description}</p> : null}
        </div>
      </Link>
      {canDelete ? (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Delete ${quest.name}`}
          className="text-muted-foreground hover:text-destructive absolute top-2 right-2 z-10"
          onClick={() => onDelete(quest)}
        >
          <Trash2Icon />
        </Button>
      ) : null}
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (slug: string) => void;
}) {
  const [state, action, pending] = React.useActionState<CreateResult | null, FormData>(createQuest, null);

  React.useEffect(() => {
    if (state?.ok) onCreated(state.slug);
    // onCreated navigates away; only fire on a fresh success.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>New quest</DialogTitle>
            <DialogDescription>A surface to compose on the grid. The slug — and its subdomain — comes from the name.</DialogDescription>
          </DialogHeader>
          <Field className="my-6">
            <FieldLabel htmlFor="quest-name">Name</FieldLabel>
            <Input id="quest-name" name="name" autoFocus placeholder="Portfolio" autoComplete="off" />
            {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create quest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  quest,
  onOpenChange,
  onDeleted,
}: {
  quest: Quest | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <AlertDialog open={!!quest} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {quest?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the quest and its saved layout. It cannot be undone.
            {error ? <span className="text-destructive mt-2 block">{error}</span> : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (!quest) return;
              setError(null);
              startTransition(async () => {
                const result = await deleteQuest(quest.id);
                if (result.ok) onDeleted();
                else setError(result.error ?? "Could not delete the quest.");
              });
            }}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
