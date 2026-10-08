"use client";

import { AuthPages, band, NoteBox } from "@/components/auth-pages";

/** A development server with no Supabase keys — CI's review sweep, a fresh clone — has no account to show. */
export function NoKeysPage({ title, line }: { title: string; line: string }) {
  return (
    <AuthPages
      title={title}
      line={line}
      items={[{
        id: "no-keys",
        span: band(1, 2, 2),
        render: () => (
          <NoteBox title="No sign-in here">
            This server has no Supabase keys, so nobody is signed in. Give the app the local stack&apos;s keys in its
            .env.local (see its .env.example).
          </NoteBox>
        ),
      }]}
    />
  );
}
