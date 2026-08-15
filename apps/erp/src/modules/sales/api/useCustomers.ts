import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  type CreateCustomerInput,
  type Customer,
  type CustomerListParams,
  type CustomerListResult,
} from "./customers";
import { queryKeys } from "./query-keys";

export function useCustomersQuery(
  params: CustomerListParams = {},
  options?: Omit<
    UseQueryOptions<CustomerListResult, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.customers.list(params as Record<string, unknown>),
    queryFn: () => listCustomers(params),
    ...options,
  });
}

export function useCustomerQuery(
  id: string,
  options?: Omit<UseQueryOptions<Customer, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => getCustomer(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}
