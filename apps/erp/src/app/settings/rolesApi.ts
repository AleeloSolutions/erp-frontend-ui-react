/**
 * Settings → Users → Roles, against `/api/v1/roles/` and
 * `/api/v1/permissions/matrix/`.
 *
 * A role is a name plus the permission codes it grants. The codes are
 * `<module>.<resource>.<action>` — one row per resource, one column per
 * action (view / view own / create / edit / edit own / delete / delete
 * own), exactly the grid the role editor renders. The matrix endpoint says
 * which cells exist; nothing here is invented client-side.
 *
 * Plain state + effect rather than React Query, matching the rest of
 * Settings (it renders in Storybook stories without a QueryProvider).
 */

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";

/** A column of the matrix. */
export interface PermissionAction {
  key: string;
  label: string;
}

/** One cell a resource offers. */
export interface PermissionCell extends PermissionAction {
  code: string;
  /** For an own-scope cell: the full-verb code that ticks it along. */
  implied_by: string | null;
}

/** One row of the matrix. */
export interface PermissionResource {
  key: string;
  group: string;
  label: string;
  help: string;
  actions: PermissionCell[];
}

export interface PermissionMatrix {
  actions: PermissionAction[];
  resources: PermissionResource[];
}

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
  const [loading, setLoading] = useState(false);
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

/**
 * The codes a set of ticks stands for once the implications are applied:
 * a full verb carries its own-scope twin (the backend does the same on
 * save, so what the editor shows is what gets stored).
 */
export function completeCodes(
  matrix: PermissionMatrix | null,
  codes: Iterable<string>
): string[] {
  const held = new Set(codes);
  if (matrix) {
    for (const resource of matrix.resources) {
      for (const cell of resource.actions) {
        if (cell.implied_by && held.has(cell.implied_by)) held.add(cell.code);
      }
    }
  }
  return [...held].sort();
}
