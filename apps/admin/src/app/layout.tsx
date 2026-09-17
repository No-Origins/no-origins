import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Montserrat } from "next/font/google";
import { ThemeProvider } from "@no-origins/ui/components/theme-provider";
import { cn } from "@no-origins/ui/lib/utils";
import "./globals.css";

// Fonts stay the host's job: the app declares --font-sans / --font-heading / --font-mono, the package only reads them.
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontHeading = Montserrat({ subsets: ["latin"], variable: "--font-heading" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "No Origins — Admin", template: "%s — No Origins Admin" },
  description: "The control surface: projects, systems, products.",
  // Nothing here is for anyone but the people on the allowlist.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * admin.no-origins.com — the control surface (Admin.md §4).
 *
 * The shell it used to wear (`Tool`, `Menu`) went with the old design system. Until the new shell is designed,
 * the layout is fonts, the theme and nothing else; each route renders itself.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", fontSans.variable, fontHeading.variable, fontMono.variable)}
    >
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
