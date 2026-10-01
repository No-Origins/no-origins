---
"@no-origins/ui": patch
---

The overlays of `Dialog`, `AlertDialog`, `Sheet` and `Drawer` no longer blur the page behind them. Sera's
`backdrop-blur-sm` came back with the 2.0 rebuild, against the system's rule of no glass (2026-09-16), and the
portfolio's More about me (2026-10-01) is the first dialog on a page, where nothing blurs (Portfolio.md P21). The
overlay keeps its 20% black.
