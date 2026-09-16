import type { Metadata, Viewport } from "next";
import { Bowlby_One, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Tool, themeBootScript } from "@no-origins/ui";
import { AdminMenu } from "@/components/admin-menu";
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
 * **A Tool, not a Page** (Atomic.md D6). §4 asks for a column, not tabs — seven-plus destinations in a row collide,
 * and the answer to that has always been a column. `Tool` holds that column — a `Menu` — beside the screens; each
 * screen is a `ToolScreen` with the layer eyebrow, the title and its actions in a 60px header.
 *
 * The block accent is **admin** (lavender, Admin.md §2 and Atomic.md D5), so the admin is never mistaken for the portfolio
 * (peach) or the showcase (blue) in a screenshot. The three layer hues live in the menu's groups, not here.
 *
 * The menu is rendered here rather than per-route, so it is not remounted between screens — and the sign-in page
 * is the one route that renders without it, which is why it does its own centring.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await currentProfile();

  return (
    <html
      lang="en"
      data-block="admin"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="noo-ground">
        {profile ? <Tool menu={<AdminMenu email={profile.email} />}>{children}</Tool> : children}
      </body>
    </html>
  );
}
