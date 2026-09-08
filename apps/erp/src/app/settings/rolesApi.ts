/**
 * Settings → Users → Roles, against `/api/v1/roles/` and
 * `/api/v1/permissions/matrix/`.
 *
 * A role is a name plus the permission codes it grants. The codes are
 * `<module>.<resource>.<verb>[_<scope>]` — one row per resource, one column
 * per verb, and each cell a rung of the scope ladder: all branches, this
 * branch, or own records. The matrix endpoint says which cells and rungs
 * exist; nothing here is invented client-side.
 *
 * Plain state + effect rather than React Query, matching the rest of
 * Settings (it renders in Storybook stories without a QueryProvider).
 */

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";

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

export function createRole(input: RoleInput) {
  return apiPost<Role>("/v1/roles/", input);
}

export function updateRole(uuid: string, input: Partial<RoleInput>) {
  return apiPatch<Role>(`/v1/roles/${uuid}/`, input);
}

export function deleteRole(uuid: string) {
  return apiDelete<void>(`/v1/roles/${uuid}/`);
}

/** The matrix: null until it arrives (or without a tenant context). */
export function usePermissionMatrix() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    void apiGet<PermissionMatrix>("/v1/permissions/matrix/")
      .then((data) => {
        if (!cancelled) setMatrix(data);
      })
      .catch(() => {
        // No tenant context: the grid renders empty rather than guessing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return matrix;
}

/** Every role of this tenant (a tenant has a handful, never pages of them). */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  // Authenticated means the effect below WILL fetch, so the first paint
  // is already loading. Starting at `false` made callers render an empty
  // list as a real count.
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    void apiGetPage<Role>("/v1/roles/?page_size=100&ordering=name")
      .then((payload) => {
        if (cancelled) return;
        setRoles(payload.data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRoles([]);
        setError(err instanceof Error ? err.message : "Could not load roles.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { roles, loading, error, reload };
}

/** One role by uuid; null while creating (no uuid) or before it loads. */
export function useRole(uuid: string | undefined) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(Boolean(uuid));

  useEffect(() => {
    if (!uuid || !isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    void apiGet<Role>(`/v1/roles/${uuid}/`)
      .then((data) => {
        if (!cancelled) setRole(data);
      })
      .catch(() => {
        // Gone, or another tenant's: the form stays on its defaults.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  return { role, loading };
}

/** The widest rung of `cell` present in `codes`, or "none". */
export function scopeOf(cell: PermissionCell, codes: ReadonlySet<string>): string {
  return cell.options.find((option) => codes.has(option.code))?.scope ?? NO_ACCESS;
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
