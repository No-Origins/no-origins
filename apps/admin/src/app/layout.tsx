import type { Metadata, Viewport } from "next";
import { Bowlby_One, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Page, themeBootScript } from "@no-origins/ui";
import { AdminRail } from "@/components/admin-rail";
import { currentProfile } from "@/lib/supabase/server";
import "./globals.css";

// Fonts are the host's job (Design-System.md §11.2 rule 2): the app sets --ff-*; the package only reads them.
const display = Bowlby_One({ weight: "400", subsets: ["latin"], variable: "--ff-display", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--ff-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--ff-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "No Origins — Admin", template: "%s — No Origins Admin" },
  description: "The control surface: projects, systems, products.",
  // Nothing here is for anyone but the people on the allowlist.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFEEEB" },
    { media: "(prefers-color-scheme: dark)", color: "#181513" },
  ],
};

/**
 * admin.no-origins.com — the control surface (Admin.md §4).
 *
 * **Page mode with a rail.** §4: "Rail, not tabs" — seven-plus destinations in a row collide the way the canvas
 * view switcher did at five, and the answer there was a column. `Page` takes a `rail` and becomes two columns.
 *
 * The block accent is **tools** (yellow), so the admin is never mistaken for the portfolio (peach) or the
 * showcase (lavender) in a screenshot. The three layer hues live in the rail's groups, not here.
 *
 * The rail is rendered here rather than per-route, so it is not remounted between screens — and the sign-in page
 * is the one route that renders without it, which is why it does its own centring.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await currentProfile();

  return (
    <html
      lang="en"
      data-block="tools"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="noo-ground min-h-full">
        {profile ? (
          <Page rail={<AdminRail email={profile.email} />}>{children}</Page>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
