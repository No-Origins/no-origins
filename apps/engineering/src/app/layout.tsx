import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Montserrat } from "next/font/google";
import { ThemeProvider } from "@no-origins/ui/components/theme-provider";
import { TooltipProvider } from "@no-origins/ui/components/tooltip";
import { Toaster } from "@no-origins/ui/components/sonner";
import { cn } from "@no-origins/ui/lib/utils";
import "./globals.css";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontHeading = Montserrat({ subsets: ["latin"], variable: "--font-heading" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "No Origins — Engineering", template: "%s — No Origins Engineering" },
  description: "Public engineering publish library — explanations and breakdowns from No Origins.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * engineering.no-origins.com — Layer A library shell.
 * Everything visible is composed from `@no-origins/ui/components/*`.
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
            <main>{children}</main>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
