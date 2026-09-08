/**
 * React Query hooks for invoices and their payments.
 *
 * Payments hang off the invoice detail key rather than owning a key of
 * their own: recording one changes the invoice's balance, so the two can
 * never be invalidated independently.
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
  cancelInvoice,
  createInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
  listPayments,
  postInvoice,
  recordPayment,
  updateInvoice,
  voidPayment,
  type Invoice,
  type InvoiceInput,
} from "./api";

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoicesQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Invoice>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: invoiceKeys.list(params as Record<string, unknown>),
    queryFn: () => listInvoices(params),
    ...options,
  });
}

export function useInvoiceQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Invoice, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: invoiceKeys.detail(uuid),
    queryFn: () => getInvoice(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

/** Every mutation on one invoice invalidates the same two keys. */
function useInvoiceMutation<TInput>(
  mutationFn: (input: TInput) => Promise<Invoice | void>,
  uuidOf: (input: TInput) => string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(uuidOf(input)),
      });
    },
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvoiceInput) => createInvoice(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useUpdateInvoiceMutation() {
  return useInvoiceMutation(
    ({ uuid, input }: { uuid: string; input: Partial<InvoiceInput> }) =>
      updateInvoice(uuid, input),
    ({ uuid }) => uuid
  );
}

export function useDeleteInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteInvoice(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

/** Issuing the invoice: this is what allocates its number. */
export function usePostInvoiceMutation() {
  return useInvoiceMutation(
    (uuid: string) => postInvoice(uuid),
    (uuid) => uuid
  );
}

export function useCancelInvoiceMutation() {
  return useInvoiceMutation(
    (uuid: string) => cancelInvoice(uuid),
    (uuid) => uuid
  );
}

export function usePaymentsQuery(uuid: string, enabled = true) {
  return useQuery({
    queryKey: [...invoiceKeys.detail(uuid), "payments"],
    queryFn: () => listPayments(uuid),
    enabled: Boolean(uuid) && enabled,
  });
}

export function useRecordPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      uuid,
      input,
    }: {
      uuid: string;
      input: {
        amount: string;
        payment_method: string;
        payment_date?: string;
        reference?: string;
      };
    }) => recordPayment(uuid, input),
    onSuccess: (_invoice, { uuid }) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({
        queryKey: [...invoiceKeys.detail(uuid), "payments"],
      });
    },
  });
}

export function useVoidPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceUuid,
      paymentUuid,
    }: {
      invoiceUuid: string;
      paymentUuid: string;
    }) => voidPayment(invoiceUuid, paymentUuid),
    onSuccess: (_invoice, { invoiceUuid }) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({
        queryKey: [...invoiceKeys.detail(invoiceUuid), "payments"],
      });
    },
  });
}
