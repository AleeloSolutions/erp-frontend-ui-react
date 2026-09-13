/**
 * React Query hooks for items.
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
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
  type Item,
  type ItemInput,
} from "./api";

export const itemKeys = {
  all: ["inventory", "items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

export function useItemsQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Item>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: itemKeys.list(params as Record<string, unknown>),
    queryFn: () => listItems(params),
    // Keep the previous page on screen while search/filter params change —
    // otherwise a slow API blanks the table and looks like search is broken.
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useItemQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Item, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: itemKeys.detail(uuid),
    queryFn: () => getItem(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ItemInput) => createItem(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: ItemInput }) =>
      updateItem(uuid, input),
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(item.uuid) });
    },
  });
}

export function useDeleteItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteItem(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
