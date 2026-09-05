/**
 * Who is signed in, and what they may reach — for the shell.
 *
 * Deliberately not React Query: `AppShell` renders inside Storybook
 * stories that have no QueryProvider, where `useQuery` throws. Fetched
 * once per session and shared, so every page mount does not re-ask.
 *
 * This drives what the navigation *offers*. It is not the security
 * boundary — the API refuses anything this misses.
 */

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";

export interface Session {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: "platform" | "owner" | "member";
  permissions: string[];
  client: { name: string; slug: string } | null;
}

let pending: Promise<Session | null> | null = null;

function load(): Promise<Session | null> {
  pending ??= apiGet<Session>("/v1/users/me/").catch(() => null);
  return pending;
}

/** Drop the cached session — call it when the tokens change (sign in/out). */
export function forgetSession() {
  pending = null;
}

/** null until it arrives, or when signed out. */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    void load().then((value) => {
      if (!cancelled) setSession(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}

export function displayName(session: Session | null): string {
  if (!session) return "";
  return `${session.first_name} ${session.last_name}`.trim() || session.email;
}

/** What we call this account in the UI. */
export function roleLabel(session: Session | null): string {
  switch (session?.user_type) {
    case "platform":
      return "Platform staff";
    case "owner":
      return "Owner";
    case "member":
      return "User";
    default:
      return "";
  }
}
