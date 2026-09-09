/**
 * Who is signed in, and what they may reach — for the shell.
 *
 * Deliberately not React Query: `AppShell` renders inside Storybook
 * stories that have no QueryProvider, where `useQuery` throws. Fetched
 * once per session and shared, so every page mount does not re-ask; and
 * every mounted `useSession` is told when it is refreshed, so installing
 * a module updates the sidebar without a reload.
 *
 * This drives what the navigation *offers*. It is not the security
 * boundary — the API refuses anything this misses.
 */

import { useEffect, useState } from "react";
import { logout as revokeRefreshToken } from "@/app/auth/api";
import { apiGet } from "@/lib/api-client";
import {
  AUTH_CHANGED_EVENT,
  clearTokens,
  getRefreshToken,
  isAuthenticated,
} from "@/lib/auth";
import { platformOrigin } from "@/lib/tenant";
import type { ModuleBundle } from "@/modules/loader";

export interface Session {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: "platform" | "owner" | "member";
  permissions: string[];
  /** The module keys this tenant has installed -- the one source for
   * which modules the app shows and mounts. */
  enabled_modules: string[];
  /** The frontends of the enabled modules that arrived as packages: what
   * the loader fetches at runtime. */
  module_bundles: ModuleBundle[];
  client: { name: string; slug: string } | null;
}

type Listener = (session: Session | null) => void;

let current: Session | null = null;
let pending: Promise<Session | null> | null = null;
const listeners = new Set<Listener>();

function load(): Promise<Session | null> {
  pending ??= apiGet<Session>("/v1/users/me/")
    .catch(() => null)
    .then((session) => {
      current = session;
      for (const listener of listeners) listener(session);
      return session;
    });
  return pending;
}

/** Drop the cached session — call it when the tokens change (sign in/out). */
export function forgetSession() {
  pending = null;
  current = null;
}

/**
 * Re-ask who is signed in and what they may reach, and tell every mounted
 * `useSession` -- what the installer calls after a module is switched on
 * or off, so the sidebar and the route guards follow immediately.
 */
export function refreshSession(): Promise<Session | null> {
  pending = null;
  return load();
}

/**
 * Sign out: revoke the refresh token, drop what this tab holds, and land
 * on the platform login screen.
 *
 * The redirect is a real navigation to the apex origin -- not a router
 * push on the tenant host -- so Log out from ridwan.localhost does not
 * drop you on ridwan's /login (where you cannot reach platform staff
 * screens). It also clears every cache in memory (React Query included)
 * so the next person to sign in on this machine starts from nothing. A
 * failed revoke still signs you out locally: the network being down is
 * no reason to stay logged in.
 */
export async function signOut() {
  const refresh = getRefreshToken();
  try {
    if (refresh) await revokeRefreshToken(refresh);
  } catch {
    // Already expired, or offline -- either way the session ends here.
  }
  clearTokens();
  forgetSession();
  window.location.assign(`${platformOrigin()}/login`);
}

/**
 * null until it arrives, or when signed out.
 *
 * Follows the tokens: a component that mounted before sign-in (the module
 * bundle loader sits above every route) picks the session up the moment
 * the tokens land, and drops it when they are cleared.
 */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(() =>
    isAuthenticated() ? current : null
  );

  useEffect(() => {
    let cancelled = false;
    let listener: Listener | null = null;

    const follow = () => {
      if (listener) listeners.delete(listener);
      listener = (value) => {
        if (!cancelled) setSession(value);
      };
      if (!isAuthenticated()) {
        setSession(null);
        return;
      }
      listeners.add(listener);
      void load().then(listener);
    };

    follow();
    window.addEventListener(AUTH_CHANGED_EVENT, follow);
    return () => {
      cancelled = true;
      if (listener) listeners.delete(listener);
      window.removeEventListener(AUTH_CHANGED_EVENT, follow);
    };
  }, []);

  return session;
}

export function displayName(session: Session | null): string {
  if (!session) return "";
  return `${session.first_name} ${session.last_name}`.trim() || session.email;
}

/**
 * What we call this *kind* of account in the UI -- owner, member, platform
 * staff. Not the role: a member's access comes from whichever role they
 * hold, and that is shown where roles are shown.
 */
export function accountKindLabel(session: Session | null): string {
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
