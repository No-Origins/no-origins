import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bowlby_One, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Footer, Page, themeBootScript } from "@no-origins/ui";
import { SiteNav, LINKS } from "@/components/site-nav";
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
 * **This is page mode, and it is the first thing on the platform to wear it.** §9 kept `Page`, `NavBar`, `Footer`
 * and `SectionHeader` specified and built after the portfolio retired them, on the grounds that documents would
 * need them. A catalogue is a document — read start to finish, no infinite canvas — so they come back here.
 *
 * The block accent is **lavender**, so the showcase never reads as part of the portfolio (peach).
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-block="editor"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="noo-ground min-h-full flex flex-col">
        <Page
          nav={<SiteNav />}
          footer={<Footer meta="design.no-origins.com" links={LINKS} linkComponent={Link} />}
        >
          {children}
        </Page>
      </body>
    </html>
  );
}
