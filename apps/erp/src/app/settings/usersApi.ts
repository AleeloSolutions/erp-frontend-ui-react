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
import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";
import { useRoles } from "./rolesApi";
import type { BranchSummary } from "./branchesApi";

/** A role as it appears on a user row. */
export interface TenantRole {
  uuid: string;
  name: string;
}

/** The three ticks of the Users row of the matrix. */
export const USER_CODES = {
  create: "settings.user.create",
  edit: "settings.user.edit",
  delete: "settings.user.delete",
} as const;

export interface TenantUser {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  /** Absolute URL of the profile picture; null → show initials. */
  avatar: string | null;
  user_type: "platform" | "owner" | "member";
  is_active: boolean;
  /** null → invited but the link has not been opened yet. */
  email_verified_at: string | null;
  /** null → they have never signed in. */
  last_login_at: string | null;
  /** The one role they hold; null for none (the owner needs none). */
  role: TenantRole | null;
  /** Where they work; null for platform staff and workspace-wide accounts. */
  branch: BranchSummary | null;
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
  /** The role's uuid; null for none. */
  role: string | null;
  /** The branch's uuid; null for workspace-wide. */
  branch: string | null;
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

/** The pencil on the avatar: upload a new picture (multipart). */
export function uploadAvatar(uuid: string, file: File) {
  const form = new FormData();
  form.append("avatar", file);
  return apiPost<TenantUser>(`/v1/users/${uuid}/avatar/`, form, { rawBody: true });
}

/** The bin on the avatar: back to initials. */
export function deleteAvatar(uuid: string) {
  return apiDelete<TenantUser>(`/v1/users/${uuid}/avatar/`);
}

/** Security tab: set a password on someone's behalf. Never your own -- the
 * backend refuses that, so the UI offers a reset link instead. */
export function setUserPassword(uuid: string, password: string) {
  return apiPost<TenantUser>(`/v1/users/${uuid}/set-password/`, { password });
}

/** Email the set-a-password link. */
export function sendPasswordReset(uuid: string) {
  return apiPost<void>(`/v1/users/${uuid}/password-reset/`);
}

/** The same link, handed back once so it can be copied. */
export function createPasswordResetLink(uuid: string) {
  return apiPost<{ link: string }>(`/v1/users/${uuid}/password-reset-link/`);
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

/** One user by uuid; null while creating (no uuid) or before it loads. */
export function useTenantUser(uuid: string | undefined) {
  const [user, setUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(Boolean(uuid));
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!uuid || !isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    void apiGet<TenantUser>(`/v1/users/${uuid}/`)
      .then((data) => {
        if (!cancelled) setUser(data);
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
  }, [uuid, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { user, loading, reload };
}

/** True once the invite has been taken up: the address is verified, or
 * they have simply signed in. */
export function isConfirmed(user: TenantUser | null): boolean {
  return Boolean(user && (user.email_verified_at || user.last_login_at));
}

/** Who is looking, and what they may do.
 *
 * Deliberately not `useMe` (React Query): this module renders in Storybook
 * stories that have no QueryProvider, where `useQuery` throws outright.
 * Here an unauthenticated render simply resolves to null and the screen
 * offers no management controls.
 */
export interface CurrentUser {
  uuid: string;
  user_type: TenantUser["user_type"];
  permissions: string[];
}

export function useCurrentUser() {
  const [me, setMe] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    void apiGet<CurrentUser>("/v1/users/me/")
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
  return useRoles().roles;
}
