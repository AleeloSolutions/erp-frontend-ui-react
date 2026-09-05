/**
 * Settings → Manage Users, against `/api/v1/users/` and `/api/v1/roles/`.
 *
 * The list is paginated, searched, sorted and filtered **server-side**: the
 * table asks for one page at a time and never holds the whole tenant in
 * memory. Records are addressed by `uuid` — the API exposes no `id`.
 *
 * Plain state + effect rather than React Query, matching the rest of this
 * module: Settings renders inside Storybook stories that have no
 * QueryProvider, and there the fetch simply never runs.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";

export interface TenantRole {
  uuid: string;
  name: string;
}

export interface TenantUser {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  user_type: "platform" | "owner" | "member";
  is_active: boolean;
  /** null → invited but the link has not been opened yet. */
  email_verified_at: string | null;
  roles: TenantRole[];
  created_at: string;
}

export interface TenantUserListParams {
  search: string;
  /** "" = every status; otherwise only active or only deactivated users. */
  isActive: "" | "true" | "false";
  ordering: string;
  page: number;
  pageSize: number;
}

export interface TenantUserListResult {
  users: TenantUser[];
  total: number;
}

export interface InviteUserInput {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  roles: string[];
}

export type UpdateUserInput = Partial<Omit<InviteUserInput, "email">> & {
  is_active?: boolean;
};

function listQuery(params: TenantUserListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
    ordering: params.ordering,
  });
  if (params.search) query.set("search", params.search);
  if (params.isActive) query.set("is_active", params.isActive);
  return query.toString();
}

export function inviteUser(input: InviteUserInput) {
  return apiPost<TenantUser>("/v1/users/", input);
}

export function updateUser(uuid: string, input: UpdateUserInput) {
  return apiPatch<TenantUser>(`/v1/users/${uuid}/`, input);
}

/**
 * One page of tenant users, refetched whenever the table's parameters
 * change. `reload` re-runs the current page after a write.
 */
export function useTenantUsers(params: TenantUserListParams) {
  const [result, setResult] = useState<TenantUserListResult>({ users: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const query = useMemo(() => listQuery(params), [params]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    // apiGetPage keeps the envelope: `meta.total` is what drives paging.
    void apiGetPage<TenantUser>(`/v1/users/?${query}`)
      .then((payload) => {
        if (cancelled) return;
        setResult({ users: payload.data, total: payload.meta.total });
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setResult({ users: [], total: 0 });
        setError(err instanceof Error ? err.message : "Could not load users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { ...result, loading, error, reload };
}

/** Who is looking, and what they may do.
 *
 * Deliberately not `useMe` (React Query): this module renders in Storybook
 * stories that have no QueryProvider, where `useQuery` throws outright.
 * Here an unauthenticated render simply resolves to null and the screen
 * offers no management controls.
 */
export function useCurrentUser() {
  const [me, setMe] = useState<
    (Pick<TenantUser, "uuid"> & { permissions: string[] }) | null
  >(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    void apiGet<{ uuid: string; permissions: string[] }>("/v1/users/me/")
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        // Signed out or no tenant: the screen stays read-only.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return me;
}

/** Every role of this tenant — what the invite/edit form offers. */
export function useTenantRoles() {
  const [roles, setRoles] = useState<TenantRole[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    void apiGetPage<TenantRole>("/v1/roles/?page_size=100")
      .then((payload) => {
        if (!cancelled) setRoles(payload.data);
      })
      .catch(() => {
        // No tenant context (or offline): the form shows no roles to pick.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return roles;
}
