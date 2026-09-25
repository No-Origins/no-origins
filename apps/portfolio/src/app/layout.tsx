import type { Metadata, Viewport } from "next";
import { Anton, Geist_Mono, Inter, Montserrat } from "next/font/google";
import { ThemeProvider } from "@no-origins/ui/components/theme-provider";
import { cn } from "@no-origins/ui/lib/utils";
import { profile } from "@/content/resume";
import "./globals.css";

// Fonts stay the host's job: the app declares --font-sans / --font-heading / --font-mono, the package only reads them.
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontHeading = Montserrat({ subsets: ["latin"], variable: "--font-heading" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
// --font-display is the app's own: an ultra-bold condensed grotesque (Anton) for the avatar's "HEY!" island and, since
// 2026-09-25, the tagline over the profile card. The design system reads sans/heading/mono; this one is the host's,
// used nowhere the package can see.
const fontDisplay = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL("https://hiddenstack.no-origins.com"),
  title: { default: `${profile.name} — No Origins`, template: "%s — No Origins" },
  description: profile.blurb,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * hiddenstack.no-origins.com — the portfolio, on the grid (Portfolio.md). The shell is the theme and the fonts;
 * every page is a GridPages that takes the whole viewport, so there is no nav, footer or container here.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", fontSans.variable, fontHeading.variable, fontMono.variable, fontDisplay.variable)}
    >
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
