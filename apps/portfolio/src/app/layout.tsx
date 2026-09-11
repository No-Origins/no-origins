import type { Metadata, Viewport } from "next";
import { Bowlby_One, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { themeBootScript } from "@no-origins/ui";
import "./globals.css";

// Fonts are the host's job (Design-System.md §11.2 rule 2): the app sets --ff-*; the package only reads them.
const display = Bowlby_One({ weight: "400", subsets: ["latin"], variable: "--ff-display", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--ff-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--ff-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Bhargav — No Origins", template: "%s — No Origins" },
  description: "Editors, design systems and agent tools. No Origins is where I keep them.",
};

// the browser's own chrome follows the ground (§2.1 / §2.5 hexes)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFEEEB" },
    { media: "(prefers-color-scheme: dark)", color: "#181513" },
  ],
};

const NOSCRIPT_CANVAS = `
.noo-canvas{height:auto}
.noo-canvas .react-flow,.noo-canvas .react-flow__renderer,.noo-canvas .react-flow__pane,.noo-canvas .react-flow__viewport,.noo-canvas .react-flow__nodes{position:static;width:auto;height:auto!important;transform:none!important}
.noo-canvas .react-flow{overflow:visible!important}
.noo-canvas .react-flow__background,.noo-canvas .react-flow__edges,.noo-canvas .react-flow__node-toolbar,.noo-canvas__threads,.noo-canvas__map{display:none}
.noo-canvas .react-flow__nodes{display:flex;flex-wrap:wrap;align-items:flex-start;gap:24px;padding:24px 16px 40px;max-width:720px;margin-inline:auto}
.noo-canvas .react-flow__node{position:static!important;transform:none!important;width:auto!important;height:auto!important}
.noo-canvas .react-flow__node-blob{flex:0 0 calc(50% - 12px);display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.noo-canvas .react-flow__node-panel,.noo-canvas .react-flow__node-region{flex:0 0 100%}
.noo-canvas .react-flow__node-region{margin-top:24px}
.noo-region__label{font-size:34px}
.noo-canvas .react-flow__panel{display:none}
.noo-canvas .react-flow__node-widget{display:none}
.noo-canvas .react-flow__node.noo-full,.noo-canvas .react-flow__node.is-faded,.noo-canvas .react-flow__node.is-source{opacity:1!important;pointer-events:all!important}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-block="portfolio"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* stamps data-theme before first paint so an explicit choice never flashes the other theme (§2.5) */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {/* Without JavaScript the canvas's server-rendered nodes keep their map transforms and pile up 4580px
            wide. These are the same declarations document mode uses below md (§8.6/§8.7), at every width —
            including the two step 12 added: widgets are not rendered (there is nothing to open them with) and
            the full views stop being hidden, because without the snap they ARE the content. */}
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: NOSCRIPT_CANVAS }} />
        </noscript>
      </head>
      <body className="noo-ground min-h-full flex flex-col">{children}</body>
    </html>
  );
}
