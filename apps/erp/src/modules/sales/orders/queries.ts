/**
 * React Query hooks for orders.
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
  acceptOrder,
  cancelOrder,
  convertOrderToInvoice,
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  sendOrder,
  updateOrder,
  type Order,
  type OrderInput,
} from "./api";
import { invoiceKeys } from "../invoices/queries";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export function useOrdersQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Order>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: orderKeys.list(params as Record<string, unknown>),
    queryFn: () => listOrders(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useOrderQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Order, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: orderKeys.detail(uuid),
    queryFn: () => getOrder(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

function useOrderMutation<TInput>(
  mutationFn: (input: TInput) => Promise<Order | void>,
  uuidOf: (input: TInput) => string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(uuidOf(input)),
      });
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderInput) => createOrder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useUpdateOrderMutation() {
  return useOrderMutation(
    ({ uuid, input }: { uuid: string; input: Partial<OrderInput> }) =>
      updateOrder(uuid, input),
    ({ uuid }) => uuid
  );
}

export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteOrder(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useSendOrderMutation() {
  return useOrderMutation(
    (uuid: string) => sendOrder(uuid),
    (uuid) => uuid
  );
}

export function useAcceptOrderMutation() {
  return useOrderMutation(
    (uuid: string) => acceptOrder(uuid),
    (uuid) => uuid
  );
}

export function useCancelOrderMutation() {
  return useOrderMutation(
    (uuid: string) => cancelOrder(uuid),
    (uuid) => uuid
  );
}

/** Converts to a draft invoice, so both the order and invoice lists change. */
export function useConvertOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => convertOrderToInvoice(uuid),
    onSuccess: (invoice, uuid) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoice.uuid) });
    },
  });
}
