/**
 * Settings → Users → Roles, against `/api/v1/roles/` and
 * `/api/v1/permissions/matrix/`.
 *
 * Types, API functions, permission helpers, and React Query hooks.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";
import { PERMISSION_MATRIX_QUERY_KEY, settingsKeys } from "./queryKeys";

export { PERMISSION_MATRIX_QUERY_KEY } from "./queryKeys";

/** A verb column, or a rung of the scope ladder. */
export interface PermissionLabel {
  key: string;
  label: string;
}

/** One rung a cell offers, and the code behind it. */
export interface PermissionOption {
  scope: string;
  label: string;
  code: string;
}

/** One verb of one resource. `options` runs widest rung first; a cell with
 * a single option is a plain tick rather than a dropdown. */
export interface PermissionCell {
  verb: string;
  label: string;
  options: PermissionOption[];
}

/** One row of the matrix. A verb the resource does not offer has no cell. */
export interface PermissionResource {
  key: string;
  group: string;
  label: string;
  help: string;
  cells: PermissionCell[];
}

export interface PermissionMatrix {
  verbs: PermissionLabel[];
  scopes: PermissionLabel[];
  resources: PermissionResource[];
}

/** The cell scope meaning "nothing granted". Not a code. */
export const NO_ACCESS = "none";

export interface Role {
  uuid: string;
  name: string;
  permissions: string[];
  /** Seeded at signup (admin, member): may be renamed, never deleted. */
  is_system: boolean;
  /** How many people hold it. */
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface RoleInput {
  name: string;
  permissions: string[];
}

/** The codes a user needs to reach the role screens at all. */
export const ROLE_CODES = {
  create: "settings.role.create",
  edit: "settings.role.edit",
  delete: "settings.role.delete",
} as const;

export function listRoles() {
  return apiGetPage<Role>("/v1/roles/?page_size=100&ordering=name");
}

export function getRole(uuid: string) {
  return apiGet<Role>(`/v1/roles/${uuid}/`);
}

export function getPermissionMatrix() {
  return apiGet<PermissionMatrix>("/v1/permissions/matrix/");
}

export function createRole(input: RoleInput) {
  return apiPost<Role>("/v1/roles/", input);
}

export function updateRole(uuid: string, input: Partial<RoleInput>) {
  return apiPatch<Role>(`/v1/roles/${uuid}/`, input);
}

export function deleteRole(uuid: string) {
  return apiDelete<void>(`/v1/roles/${uuid}/`);
}

/** Permission matrix — changes rarely (module install/disable). */
export function usePermissionMatrixQuery(
  options?: Omit<UseQueryOptions<PermissionMatrix, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: PERMISSION_MATRIX_QUERY_KEY,
    queryFn: getPermissionMatrix,
    enabled: isAuthenticated(),
    staleTime: 5 * 60_000,
    ...options,
  });
}

/** Back-compat alias: returns data or null (not the full query result). */
export function usePermissionMatrix() {
  return usePermissionMatrixQuery().data ?? null;
}

/** Every role of this tenant (a tenant has a handful, never pages of them). */
export function useRolesQuery(
  options?: Omit<
    UseQueryOptions<Role[], Error, Role[], ReturnType<typeof settingsKeys.roles.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: settingsKeys.roles.list(),
    queryFn: async () => (await listRoles()).data,
    enabled: isAuthenticated(),
    ...options,
  });
}

/** Back-compat shape used by list panels and overview tiles. */
export function useRoles() {
  const query = useRolesQuery();
  return {
    roles: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    reload: () => void query.refetch(),
  };
}

/** One role by uuid; null while creating (no uuid) or before it loads. */
export function useRoleQuery(
  uuid: string | undefined,
  options?: Omit<
    UseQueryOptions<Role, Error, Role, ReturnType<typeof settingsKeys.roles.detail>>,
    "queryKey" | "queryFn" | "enabled"
  >
) {
  return useQuery({
    queryKey: settingsKeys.roles.detail(uuid ?? ""),
    queryFn: () => getRole(uuid!),
    enabled: Boolean(uuid) && isAuthenticated(),
    ...options,
  });
}

export function useRole(uuid: string | undefined) {
  const query = useRoleQuery(uuid);
  return {
    role: query.data ?? null,
    loading: query.isLoading,
  };
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.roles.all });
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: Partial<RoleInput> }) =>
      updateRole(uuid, input),
    onSuccess: (role) => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.roles.all });
      queryClient.setQueryData(settingsKeys.roles.detail(role.uuid), role);
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.roles.all });
    },
  });
}

/** The widest rung of `cell` present in `codes`, or "none". */
export function scopeOf(cell: PermissionCell, codes: ReadonlySet<string>): string {
  return cell.options.find((option) => codes.has(option.code))?.scope ?? NO_ACCESS;
}

/**
 * How many matrix cells are granted — one verb with any scope counts as
 * one, however many ladder codes sit under it. Matches the role form
 * summary ("N permissions granted"), not `permissions.length`.
 */
export function countGrantedCells(
  matrix: PermissionMatrix | null,
  codes: Iterable<string>
): number {
  const held = codes instanceof Set ? codes : new Set(codes);
  if (!matrix) return held.size;
  return matrix.resources.reduce(
    (count, resource) =>
      count + resource.cells.filter((cell) => scopeOf(cell, held) !== NO_ACCESS).length,
    0
  );
}

/**
 * The codes a set of ticks stands for once the ladder is applied: a wider
 * rung carries every narrower one. The backend does the same on save, so
 * what the editor shows is what gets stored.
 */
export function completeCodes(
  matrix: PermissionMatrix | null,
  codes: Iterable<string>
): string[] {
  const held = new Set(codes);
  if (matrix) {
    for (const resource of matrix.resources) {
      for (const cell of resource.cells) {
        const rung = cell.options.findIndex((option) => held.has(option.code));
        if (rung >= 0) {
          for (const narrower of cell.options.slice(rung + 1)) held.add(narrower.code);
        }
      }
    }
  }
  return [...held].sort();
}

/** Every code of one cell, for clearing it before setting a new rung. */
export function cellCodes(cell: PermissionCell): string[] {
  return cell.options.map((option) => option.code);
}

/**
 * Whether a role only resolves through the holder's branch.
 *
 * A grant whose widest rung is the branch one comes back empty for
 * somebody with no branch, so the API refuses that pairing. A role that
 * also holds the "all branches" rung of the same verb is fine: the branch
 * rung stored underneath is simply never the one that answers.
 */
export function needsBranch(permissions: readonly string[]): boolean {
  const held = new Set(permissions);
  return permissions.some(
    (code) => code.endsWith("_branch") && !held.has(code.slice(0, -"_branch".length))
  );
}
