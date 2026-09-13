/**
 * React Query hooks for categories.
 *
 * Lists are server-side paginated, so the query key carries the whole
 * parameter object and a page change is a new query rather than a client
 * filter over everything.
 */

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { ListParams, Page } from "../shared/api";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
  type Category,
  type CategoryInput,
} from "./api";

export const categoryKeys = {
  all: ["inventory", "categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

export function useCategoriesQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Category>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: categoryKeys.list(params as Record<string, unknown>),
    queryFn: () => listCategories(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useCategoryQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Category, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: categoryKeys.detail(uuid),
    queryFn: () => getCategory(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: CategoryInput }) =>
      updateCategory(uuid, input),
    onSuccess: (category) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(category.uuid),
      });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteCategory(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
