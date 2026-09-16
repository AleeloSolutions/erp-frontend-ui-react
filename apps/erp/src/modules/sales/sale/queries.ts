/**
 * React Query hooks for sales and their payments.
 *
 * Payments hang off the sale detail key rather than owning a key of their
 * own: recording one changes the sale's balance, so the two can never be
 * invalidated independently.
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
  createSale,
  deleteSale,
  getSale,
  listSalePayments,
  listSales,
  recordSalePayment,
  sendSale,
  updateSale,
  voidSalePayment,
  type Sale,
  type SaleInput,
  type SalePaymentInput,
} from "./api";

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

/** Every mutation on one sale invalidates the same two keys. */
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

/** The money collected against one sale; a child of its detail key. */
export function useSalePaymentsQuery(uuid: string, enabled = true) {
  return useQuery({
    queryKey: [...saleKeys.detail(uuid), "payments"],
    queryFn: () => listSalePayments(uuid),
    enabled: Boolean(uuid) && enabled,
  });
}

export function useRecordSalePaymentMutation() {
  return useSaleMutation(
    ({ uuid, input }: { uuid: string; input: SalePaymentInput }) =>
      recordSalePayment(uuid, input),
    ({ uuid }) => uuid
  );
}

export function useVoidSalePaymentMutation() {
  return useSaleMutation(
    ({ uuid, paymentUuid }: { uuid: string; paymentUuid: string }) =>
      voidSalePayment(uuid, paymentUuid),
    ({ uuid }) => uuid
  );
}
