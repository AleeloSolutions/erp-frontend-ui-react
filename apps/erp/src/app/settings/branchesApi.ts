/**
 * Settings → Users → Branches, against `/api/v1/branches/`.
 *
 * A branch is a shop, office or warehouse of the workspace. Every tenant
 * has one from signup and exactly one default; a user works at one branch,
 * and a branch-scoped permission rung resolves through it.
 *
 * Plain state + effect rather than React Query, matching the rest of
 * Settings (it renders in Storybook stories without a QueryProvider).
 */

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";

/** A branch as it appears on a user row or a document. */
export interface BranchSummary {
  uuid: string;
  name: string;
  code: string;
}

export interface Branch extends BranchSummary {
  /** Exactly one per workspace. It cannot be archived or deleted. */
  is_default: boolean;
  is_archived: boolean;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  /** How many people work here. */
  user_count: number;
  created_at: string;
  updated_at: string;
}

export type BranchInput = Partial<
  Omit<Branch, "uuid" | "user_count" | "created_at" | "updated_at">
>;

/** The codes the branches screen checks. Branches are workspace-wide, so
 * these carry no scope ladder. */
export const BRANCH_CODES = {
  create: "settings.branch.create",
  edit: "settings.branch.edit",
  delete: "settings.branch.delete",
} as const;

export function createBranch(input: BranchInput) {
  return apiPost<Branch>("/v1/branches/", input);
}

export function updateBranch(uuid: string, input: BranchInput) {
  return apiPatch<Branch>(`/v1/branches/${uuid}/`, input);
}

export function deleteBranch(uuid: string) {
  return apiDelete<void>(`/v1/branches/${uuid}/`);
}

/** Every branch of this tenant. A workspace has a handful, never pages. */
export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    void apiGetPage<Branch>("/v1/branches/?page_size=100&ordering=name")
      .then((payload) => {
        if (cancelled) return;
        setBranches(payload.data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setBranches([]);
        setError(err instanceof Error ? err.message : "Could not load branches.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { branches, loading, error, reload };
}

/** One branch by uuid; null while creating (no uuid) or before it loads. */
export function useBranch(uuid: string | undefined) {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(Boolean(uuid));

  useEffect(() => {
    if (!uuid || !isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    void apiGet<Branch>(`/v1/branches/${uuid}/`)
      .then((data) => {
        if (!cancelled) setBranch(data);
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

  return { branch, loading };
}
