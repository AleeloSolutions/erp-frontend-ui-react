/**
 * React Query hooks for sales and their payments.
 *
 * Payments hang off the sale detail key rather than owning a key of their
 * own: recording one changes the sale's balance, so the two can never be
 * invalidated independently.
 *
 * The grouped views nest under the list key for the same reason: a
 * grouped screen is the list, counted differently. Recording a payment or
 * deleting a sale already invalidates `lists()` (and `all`), so both
 * reach the group headers and the open group's rows without a mutation
 * having to know a grouping exists.
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
  listSaleGroups,
  listSalePayments,
  listSales,
  listSalesInGroup,
  recordSalePayment,
  sendSale,
  updateSale,
  voidSalePayment,
  NULL_GROUP_KEY,
  type Sale,
  type SaleGroupBy,
  type SaleGroupPage,
  type SaleInput,
  type SalePaymentInput,
} from "./api";

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...saleKeys.lists(), filters] as const,
  /** Group headers and a group's rows are both the list, so both sit under it. */
  groups: () => [...saleKeys.lists(), "groups"] as const,
  group: (groupBy: string, filters: Record<string, unknown>) =>
    [...saleKeys.groups(), groupBy, filters] as const,
  groupRows: () => [...saleKeys.lists(), "group-rows"] as const,
  /** The null group is keyed by the sentinel, so it cannot collide with "no key". */
  groupRow: (
    groupBy: string,
    groupKey: string | null,
    filters: Record<string, unknown>
  ) => [...saleKeys.groupRows(), groupBy, groupKey ?? NULL_GROUP_KEY, filters] as const,
  details: () => [...saleKeys.all, "detail"] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
};

/**
 * What a caller may pass a grouped hook.
 *
 * `enabled` is narrowed to a plain boolean because these hooks AND it
 * with their own guard: a caller can close a query (a collapsed group),
 * never open one that has no grouping to ask about.
 */
type SaleGroupedQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error>,
  "queryKey" | "queryFn" | "enabled"
> & { enabled?: boolean };

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

/**
 * A page of GROUPS: `meta.total` counts groups, and `aggregate` is the
 * grand total over the whole filtered set — the footer reads that, never
 * a sum of the groups on screen. Idle until a grouping is chosen.
 */
export function useSaleGroupsQuery(
  groupBy: SaleGroupBy | null | undefined,
  params: ListParams = {},
  options?: SaleGroupedQueryOptions<SaleGroupPage>
) {
  return useQuery({
    queryKey: saleKeys.group(groupBy ?? "", params as Record<string, unknown>),
    queryFn: ({ signal }) => {
      // Unreachable while `enabled` below holds; it is the compiler's
      // narrowing rather than a cast that lies about it.
      if (!groupBy) throw new Error("useSaleGroupsQuery ran without a grouping.");
      return listSaleGroups(groupBy, params, { signal });
    },
    placeholderData: keepPreviousData,
    ...options,
    enabled: Boolean(groupBy) && (options?.enabled ?? true),
  });
}

/**
 * One group's rows: the flat list narrowed by that group's own key.
 *
 * Expansion belongs to the screen, so the caller owns it through
 * `enabled`, and a group closed mid-flight aborts through React Query's
 * `signal` (it is passed down to `fetch`).
 *
 * No `keepPreviousData` here, unlike the flat and grouped lists: a group
 * header names the rows underneath it, so holding the last group's rows
 * while the next one loads would file sales under the wrong heading. The
 * headers themselves each carry their own label and cannot be misread
 * that way, which is why they do keep it.
 */
export function useSaleGroupRowsQuery(
  groupBy: SaleGroupBy | null | undefined,
  groupKey: string | null,
  params: ListParams = {},
  options?: SaleGroupedQueryOptions<Page<Sale>>
) {
  return useQuery({
    queryKey: saleKeys.groupRow(
      groupBy ?? "",
      groupKey,
      params as Record<string, unknown>
    ),
    queryFn: ({ signal }) => {
      if (!groupBy) throw new Error("useSaleGroupRowsQuery ran without a grouping.");
      return listSalesInGroup(groupBy, groupKey, params, { signal });
    },
    ...options,
    enabled: Boolean(groupBy) && (options?.enabled ?? true),
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
