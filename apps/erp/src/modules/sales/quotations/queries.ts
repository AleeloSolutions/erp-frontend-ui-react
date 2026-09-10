/**
 * React Query hooks for quotations.
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
  acceptQuotation,
  cancelQuotation,
  convertQuotationToInvoice,
  createQuotation,
  deleteQuotation,
  getQuotation,
  listQuotations,
  sendQuotation,
  updateQuotation,
  type Quotation,
  type QuotationInput,
} from "./api";
import { invoiceKeys } from "../invoices/queries";

export const quotationKeys = {
  all: ["quotations"] as const,
  lists: () => [...quotationKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...quotationKeys.lists(), filters] as const,
  details: () => [...quotationKeys.all, "detail"] as const,
  detail: (id: string) => [...quotationKeys.details(), id] as const,
};

export function useQuotationsQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Quotation>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: quotationKeys.list(params as Record<string, unknown>),
    queryFn: () => listQuotations(params),
    ...options,
  });
}

export function useQuotationQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Quotation, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: quotationKeys.detail(uuid),
    queryFn: () => getQuotation(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

function useQuotationMutation<TInput>(
  mutationFn: (input: TInput) => Promise<Quotation | void>,
  uuidOf: (input: TInput) => string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: quotationKeys.detail(uuidOf(input)),
      });
    },
  });
}

export function useCreateQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuotationInput) => createQuotation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
    },
  });
}

export function useUpdateQuotationMutation() {
  return useQuotationMutation(
    ({ uuid, input }: { uuid: string; input: Partial<QuotationInput> }) =>
      updateQuotation(uuid, input),
    ({ uuid }) => uuid
  );
}

export function useDeleteQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteQuotation(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
}

export function useSendQuotationMutation() {
  return useQuotationMutation(
    (uuid: string) => sendQuotation(uuid),
    (uuid) => uuid
  );
}

export function useAcceptQuotationMutation() {
  return useQuotationMutation(
    (uuid: string) => acceptQuotation(uuid),
    (uuid) => uuid
  );
}

export function useCancelQuotationMutation() {
  return useQuotationMutation(
    (uuid: string) => cancelQuotation(uuid),
    (uuid) => uuid
  );
}

/** Converts to a draft invoice, so both the quotation and invoice lists change. */
export function useConvertQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => convertQuotationToInvoice(uuid),
    onSuccess: (invoice, uuid) => {
      void queryClient.invalidateQueries({ queryKey: quotationKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoice.uuid) });
    },
  });
}
