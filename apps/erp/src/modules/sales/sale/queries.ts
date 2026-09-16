/**
 * React Query hooks for sales.
 */

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Page } from "@/lib/api-client";
import type { ListParams } from "../shared/api";
import {
  acceptSale,
  cancelSale,
  convertSaleToInvoice,
  createSale,
  deleteSale,
  getSale,
  listSales,
  sendSale,
  updateSale,
  type Sale,
  type SaleInput,
} from "./api";
import { invoiceKeys } from "../invoices/queries";

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...saleKeys.lists(), filters] as const,
  details: () => [...saleKeys.all, "detail"] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
};

export function useSalesQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Sale>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: saleKeys.list(params as Record<string, unknown>),
    queryFn: () => listSales(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useSaleQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Sale, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: saleKeys.detail(uuid),
    queryFn: () => getSale(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

function useSaleMutation<TInput>(
  mutationFn: (input: TInput) => Promise<Sale | void>,
  uuidOf: (input: TInput) => string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: saleKeys.detail(uuidOf(input)),
      });
    },
  });
}

export function useCreateSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaleInput) => createSale(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
    },
  });
}

export function useUpdateSaleMutation() {
  return useSaleMutation(
    ({ uuid, input }: { uuid: string; input: Partial<SaleInput> }) =>
      updateSale(uuid, input),
    ({ uuid }) => uuid
  );
}

export function useDeleteSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteSale(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: saleKeys.all });
    },
  });
}

export function useSendSaleMutation() {
  return useSaleMutation(
    (uuid: string) => sendSale(uuid),
    (uuid) => uuid
  );
}

export function useAcceptSaleMutation() {
  return useSaleMutation(
    (uuid: string) => acceptSale(uuid),
    (uuid) => uuid
  );
}

export function useCancelSaleMutation() {
  return useSaleMutation(
    (uuid: string) => cancelSale(uuid),
    (uuid) => uuid
  );
}

/** Converts to a draft invoice, so both the sale and invoice lists change. */
export function useConvertSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => convertSaleToInvoice(uuid),
    onSuccess: (invoice, uuid) => {
      void queryClient.invalidateQueries({ queryKey: saleKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoice.uuid) });
    },
  });
}
