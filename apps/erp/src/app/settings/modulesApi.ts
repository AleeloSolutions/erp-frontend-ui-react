/**
 * Settings → Modules, against `/api/v1/modules/`.
 *
 * The catalogue of modules this release ships, merged with what this
 * tenant has switched on. Installing seeds the module's defaults for the
 * tenant, grants its codes to the admin role and exposes its routes,
 * matrix rows and navigation; disabling is a soft-off that keeps every
 * row. Module identity is the catalogue `key`, not a uuid -- a module
 * that was never installed has no row yet.
 *
 * Plain state + effect rather than React Query, matching the rest of
 * Settings (it renders in Storybook stories without a QueryProvider).
 */

import { useCallback, useEffect, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";
import { ME_QUERY_KEY } from "@/app/auth/useMe";
import { refreshSession } from "@/app/session";
import { PERMISSION_MATRIX_QUERY_KEY } from "./rolesApi";

export type ModuleStatus = "available" | "installed" | "disabled";

export interface ModuleEntry {
  /** null until the module has been installed once. */
  uuid: string | null;
  /** The catalogue key: what `enabled_modules` lists and what the routes use. */
  key: string;
  label: string;
  version: string;
  nav_area: string;
  /** Keys that must be installed first. */
  depends_on: string[];
  status: ModuleStatus;
  /** The first install; null while `available`. */
  installed_at: string | null;
}

/** The two ticks of the Modules row of the matrix. */
export const MODULE_CODES = {
  view: "settings.module.view",
  edit: "settings.module.edit",
} as const;

export function installModule(key: string) {
  return apiPost<ModuleEntry>(`/v1/modules/${encodeURIComponent(key)}/install/`);
}

export function disableModule(key: string) {
  return apiPost<ModuleEntry>(`/v1/modules/${encodeURIComponent(key)}/disable/`);
}

/**
 * What an install or a disable changes elsewhere in the app: the session
 * (sidebar, route guards, what the panels may offer) and the React Query
 * copies of `me` and the permission matrix, so the next screen to mount
 * reads the new state rather than a cached one. The plain-state matrix
 * hook (`usePermissionMatrix`) refetches on every mount and needs nothing.
 */
export async function invalidateAfterModuleChange(queryClient?: QueryClient | null) {
  await Promise.all([
    refreshSession(),
    queryClient?.invalidateQueries({ queryKey: ME_QUERY_KEY }),
    queryClient?.invalidateQueries({ queryKey: PERMISSION_MATRIX_QUERY_KEY }),
  ]);
}

/** The catalogue with this tenant's state. A release ships a handful of
 * modules, never pages of them. */
export function useModules() {
  const [modules, setModules] = useState<ModuleEntry[]>([]);
  // Authenticated means the effect below WILL fetch, so the first paint
  // is already loading.
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    void apiGet<ModuleEntry[]>("/v1/modules/")
      .then((data) => {
        if (cancelled) return;
        setModules(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setModules([]);
        setError(err instanceof Error ? err.message : "Could not load modules.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { modules, loading, error, reload };
}
