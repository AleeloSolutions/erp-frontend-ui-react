/**
 * Settings → Modules, against `/api/v1/modules/`.
 *
 * The catalogue of modules this release ships, merged with what this
 * tenant has switched on. Installing seeds the module's defaults for the
 * tenant, grants its codes to the admin role and exposes its routes,
 * matrix rows and navigation; disabling is a soft-off that keeps every
 * row. Module identity is the catalogue `key`, not a uuid -- a module
 * that was never installed has no row yet.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";
import { ME_QUERY_KEY } from "@/app/auth/useMe";
import { refreshSession } from "@/app/session";
import { PERMISSION_MATRIX_QUERY_KEY, settingsKeys } from "./queryKeys";

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

export function listModules() {
  return apiGet<ModuleEntry[]>("/v1/modules/");
}

export function installModule(key: string) {
  return apiPost<ModuleEntry>(`/v1/modules/${encodeURIComponent(key)}/install/`);
}

export function disableModule(key: string) {
  return apiPost<ModuleEntry>(`/v1/modules/${encodeURIComponent(key)}/disable/`);
}

/**
 * What an install or a disable changes elsewhere in the app: the session
 * (sidebar, route guards, what the panels may offer) and the React Query
 * copies of `me`, the permission matrix, and the modules list.
 */
export async function invalidateAfterModuleChange(queryClient?: QueryClient | null) {
  await Promise.all([
    refreshSession(),
    queryClient?.invalidateQueries({ queryKey: ME_QUERY_KEY }),
    queryClient?.invalidateQueries({ queryKey: PERMISSION_MATRIX_QUERY_KEY }),
    queryClient?.invalidateQueries({ queryKey: settingsKeys.modules.all }),
  ]);
}

export function useModulesQuery(
  options?: Omit<
    UseQueryOptions<ModuleEntry[], Error, ModuleEntry[], ReturnType<typeof settingsKeys.modules.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: settingsKeys.modules.list(),
    queryFn: listModules,
    enabled: isAuthenticated(),
    ...options,
  });
}

/** The catalogue with this tenant's state. A release ships a handful of
 * modules, never pages of them. */
export function useModules() {
  const query = useModulesQuery();
  return {
    modules: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    reload: () => void query.refetch(),
  };
}

export function useInstallModuleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: installModule,
    onSuccess: async () => {
      await invalidateAfterModuleChange(queryClient);
    },
  });
}

export function useDisableModuleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disableModule,
    onSuccess: async () => {
      await invalidateAfterModuleChange(queryClient);
    },
  });
}
