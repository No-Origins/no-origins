import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Montserrat } from "next/font/google";
import { ThemeProvider } from "@no-origins/ui/components/theme-provider";
import { TooltipProvider } from "@no-origins/ui/components/tooltip";
import { Toaster } from "@no-origins/ui/components/sonner";
import { cn } from "@no-origins/ui/lib/utils";
import { ShowcaseNav } from "@/components/showcase-nav";
import "./globals.css";

// Fonts stay the host's job: the app declares --font-sans / --font-heading / --font-mono, the package only reads them.
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontHeading = Montserrat({ subsets: ["latin"], variable: "--font-heading" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "No Origins — Design System", template: "%s — No Origins Design System" },
  description: "Every atom and molecule in the No Origins design system, on one page each.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * design.no-origins.com — the showcase.
 *
 * Rebuilt on shadcn/ui (style `radix-sera`, base `radix`) and put on the grid: nothing here scrolls, every page is a
 * `GridPages` under the one bar that names where you are, arranged the portfolio's way (Portfolio.md P2). Everything
 * it renders is imported from `@no-origins/ui/components/*` — the showcase owns no components of its own beyond this
 * shell.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", fontSans.variable, fontHeading.variable, fontMono.variable)}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <TooltipProvider>
            <ShowcaseNav />
            {/* No container here: every page is a grid that fills the viewport under the nav. */}
            <main>{children}</main>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
