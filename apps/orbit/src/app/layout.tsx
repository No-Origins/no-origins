import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Montserrat } from "next/font/google";
import { ThemeProvider } from "@no-origins/ui/components/theme-provider";
import { cn } from "@no-origins/ui/lib/utils";
import { World } from "@/components/world";
import "./globals.css";

// Fonts stay the host's job: the app declares --font-sans / --font-heading / --font-mono, the package only reads them.
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontHeading = Montserrat({ subsets: ["latin"], variable: "--font-heading" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "No Origins — Orbit", template: "%s — No Origins Orbit" },
  description: "Orbit, the world of No Origins.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * orbit.no-origins.com — Orbit, the world (World.md). The world is drawn here, in the root layout, so that it stays
 * mounted from one place to the next (W2); each place's page is the interface over it (W10). The interface's layer lets
 * the pointer through to the world (a drag, the wheel), and takes it back only on what it draws: the sidebar, the card.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", fontSans.variable, fontHeading.variable, fontMono.variable)}
    >
      <body className="h-dvh overflow-hidden">
        <ThemeProvider>
          <World />
          <div className="pointer-events-none relative">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
