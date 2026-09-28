---
"@no-origins/ui": minor
---

`@no-origins/ui/hooks/use-reading-focus` (`useReadingFocus`): Tab and the arrow keys move focus in reading order, left
to right and top to bottom as the boxes stand on the screen, not as they come in the document (Grid.md D45). The arrows
are a game controller's: they only move focus, and a control that moves on them itself (a field, a select, a slider, a
menu, a radio group) keeps them. Every tab of a tab list is a stop of its own. A page that uses it turns the grid's
keys off (`GridPages`' `keyboard={false}`), so the arrows never turn it.
