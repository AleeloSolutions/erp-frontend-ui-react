import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
  updateInvoice,
  type CreateInvoiceInput,
  type Invoice,
  type InvoiceListParams,
  type InvoiceListResult,
  type UpdateInvoiceInput,
} from "./invoices";
import { queryKeys } from "./query-keys";

export function useInvoicesQuery(
  params: InvoiceListParams = {},
  options?: Omit<UseQueryOptions<InvoiceListResult, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params as Record<string, unknown>),
    queryFn: () => listInvoices(params),
    ...options,
  });
}

export function useInvoiceQuery(
  id: string,
  options?: Omit<UseQueryOptions<Invoice, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => getInvoice(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
    },
  });
}

export function useUpdateInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInvoiceInput }) =>
      updateInvoice(id, input),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(invoice.id),
      });
    },
  });
}

export function useDeleteInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}
