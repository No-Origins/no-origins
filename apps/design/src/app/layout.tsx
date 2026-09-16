import type { Metadata, Viewport } from "next";
import { Bowlby_One, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Tool, themeBootScript, type MenuItem } from "@no-origins/ui";
import { byLayer, layerNotes, layers } from "@no-origins/ui/registry";
import { DesignMenu } from "@/components/design-menu";
import "./globals.css";

// Fonts are the host's job (Design-System.md §11.2 rule 2): the app sets --ff-*; the package only reads them.
const display = Bowlby_One({ weight: "400", subsets: ["latin"], variable: "--ff-display", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--ff-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--ff-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "No Origins — Design System", template: "%s — No Origins Design System" },
  description: "The tokens, the components and the grammar every No Origins block is built from.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFEEEB" },
    { media: "(prefers-color-scheme: dark)", color: "#181513" },
  ],
};

/**
 * design.no-origins.com — the showcase (Design-System.md §11.4, §14 step 14).
 *
 * **It wears the admin's shell** (2026-09-15). It shipped in page mode — `Page`, `NavBar`, `Footer` — and that was
 * right for three routes. Splitting the two long scrolls into a screen per token and a screen per Atomic layer took
 * it to eleven, and a reference you navigate is a Tool, not a document you read top to bottom (Atomic.md D6). So the
 * `NavBar` becomes the `Menu` the admin uses, the `Footer` goes (its links were the nav, which is now always on
 * screen), and each route is a `ToolScreen` whose 56px header names where you are.
 *
 * Page mode does not lose its consumer by this: the portfolio's `(page)` group still wears `Page`, `NavBar` and
 * `Footer` across the fixtures, which is where they are exercised.
 *
 * The block accent is **design** (blue, Atomic.md D5), so the showcase never reads as part of the portfolio (peach)
 * or the admin (lavender). The menu is rendered here rather than per route, so it does not remount between screens.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  // Counted on the server: the registry imports every component in the package, and the menu is a client island.
  const components: MenuItem[] = layers.map((l) => ({
    href: `/components/${layerNotes[l].slug}`,
    label: layerNotes[l].title,
    badge: byLayer(l).length,
  }));

  return (
    <html
      lang="en"
      data-block="design"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="noo-ground">
        <Tool menu={<DesignMenu components={components} />}>{children}</Tool>
      </body>
    </html>
  );
}
