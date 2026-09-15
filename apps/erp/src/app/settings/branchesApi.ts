/**
 * Settings → Users → Branches, against `/api/v1/branches/`.
 *
 * A branch is a shop, office or warehouse of the workspace. Every tenant
 * has one from signup and exactly one default; a user works at one branch,
 * and a branch-scoped permission rung resolves through it.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";
import { settingsKeys } from "./queryKeys";

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

export function listBranches() {
  return apiGetPage<Branch>("/v1/branches/?page_size=100&ordering=name");
}

export function getBranch(uuid: string) {
  return apiGet<Branch>(`/v1/branches/${uuid}/`);
}

export function createBranch(input: BranchInput) {
  return apiPost<Branch>("/v1/branches/", input);
}

export function updateBranch(uuid: string, input: BranchInput) {
  return apiPatch<Branch>(`/v1/branches/${uuid}/`, input);
}

export function deleteBranch(uuid: string) {
  return apiDelete<void>(`/v1/branches/${uuid}/`);
}

export function useBranchesQuery(
  options?: Omit<
    UseQueryOptions<Branch[], Error, Branch[], ReturnType<typeof settingsKeys.branches.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: settingsKeys.branches.list(),
    queryFn: async () => (await listBranches()).data,
    enabled: isAuthenticated(),
    ...options,
  });
}

/** Every branch of this tenant. A workspace has a handful, never pages. */
export function useBranches() {
  const query = useBranchesQuery();
  return {
    branches: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    reload: () => void query.refetch(),
  };
}

export function useBranchQuery(
  uuid: string | undefined,
  options?: Omit<
    UseQueryOptions<Branch, Error, Branch, ReturnType<typeof settingsKeys.branches.detail>>,
    "queryKey" | "queryFn" | "enabled"
  >
) {
  return useQuery({
    queryKey: settingsKeys.branches.detail(uuid ?? ""),
    queryFn: () => getBranch(uuid!),
    enabled: Boolean(uuid) && isAuthenticated(),
    ...options,
  });
}

/** One branch by uuid; null while creating (no uuid) or before it loads. */
export function useBranch(uuid: string | undefined) {
  const query = useBranchQuery(uuid);
  return {
    branch: query.data ?? null,
    loading: query.isLoading,
  };
}

export function useCreateBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.branches.all });
    },
  });
}

export function useUpdateBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: BranchInput }) =>
      updateBranch(uuid, input),
    onSuccess: (branch) => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.branches.all });
      queryClient.setQueryData(settingsKeys.branches.detail(branch.uuid), branch);
    },
  });
}

export function useDeleteBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.branches.all });
    },
  });
}
