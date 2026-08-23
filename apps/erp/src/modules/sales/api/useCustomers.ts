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
  updateCustomer,
  type CreateCustomerInput,
  type Customer,
  type CustomerListParams,
  type CustomerListResult,
  type UpdateCustomerInput,
} from "./customers";
import { queryKeys } from "./query-keys";

export function useCustomersQuery(
  params: CustomerListParams = {},
  options?: Omit<UseQueryOptions<CustomerListResult, Error>, "queryKey" | "queryFn">
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

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      updateCustomer(id, input),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(customer.id),
      });
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
