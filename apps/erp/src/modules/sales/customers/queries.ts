/**
 * React Query hooks for customers.
 *
 * Lists are server-side paginated, so the query key carries the whole
 * parameter object and a page change is a new query rather than a client
 * filter over everything.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Page } from "@/lib/api-client";
import type { ListParams } from "../shared/api";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  type Customer,
  type CustomerInput,
} from "./api";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useCustomersQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Customer>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: customerKeys.list(params as Record<string, unknown>),
    queryFn: () => listCustomers(params),
    ...options,
  });
}

export function useCustomerQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Customer, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: customerKeys.detail(uuid),
    queryFn: () => getCustomer(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: CustomerInput }) =>
      updateCustomer(uuid, input),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: customerKeys.detail(customer.uuid),
      });
    },
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteCustomer(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
