---
"@no-origins/ui": minor
---

Spacing is two layers (Spacing.md): a base of nine steps and, on it, spaces named by their job — `inset`, `inset-tight`, `inset-pill` (each the same on every side), `stack`, `stack-tight`, `inline`, `inline-tight`, `gutter` — as `--space-*` tokens and Tailwind spacing (`p-inset`, `gap-stack`). A box's padding clears its round corner. `Slot` takes its inset by job, and a surface slot's default is `inset`; Card, Alert, Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Empty and the menu panels (DropdownMenu, ContextMenu, Menubar, Select, Combobox, Command) pad by job. `lib/spacing.ts` holds the steps and jobs for script.
