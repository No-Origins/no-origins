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
      </head>
      <body className="noo-ground min-h-full flex flex-col">{children}</body>
    </html>
  );
}
