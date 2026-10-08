import type { NextConfig } from "next";

// auth.no-origins.com — the login (Admin.md §8.4, step 5): signing in, making an account, the account's own settings,
// and the apps a person may open. Every app's sign-in comes here; the session it makes is every app's.
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui", "@no-origins/auth"],
};

export default nextConfig;
