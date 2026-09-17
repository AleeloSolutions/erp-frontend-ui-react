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
 * reach every level of group headers and every open group's rows without a
 * mutation having to know a grouping exists.
 *
 * Grouping is a TREE, one request per level: the top level is a hook, and
 * every node opened below it is a query-options factory fed to `useQueries`,
 * because the number of open nodes is a property of what the user expanded and
 * hooks cannot be called in a loop.
 */

import {
  keepPreviousData,
  queryOptions,
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
  type Sale,
  type SaleGroupBy,
  type SaleGroupLevelRequest,
  type SaleGroupPage,
  type SaleInput,
  type SalePaymentInput,
} from "./api";

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...saleKeys.lists(), filters] as const,
  /**
   * Every level of groups and every page of a group's rows is the same list
   * counted differently, so all of it sits under `lists()` — one invalidation
   * after a mutation reaches the headers, the sub-groups and the open rows
   * without the mutation having to know a grouping exists.
   *
   * A node is keyed by its `group_path`, which already names every level above
   * it and carries `__none__` for a null key: `""` is the top level, and no
   * two nodes of a tree can collide.
   */
  groups: () => [...saleKeys.lists(), "groups"] as const,
  /** Every sub-group page of one node — the prefix a retry refetches. */
  groupNode: (path: string) => [...saleKeys.groups(), path] as const,
  groupLevel: (path: string, groupBy: string, filters: Record<string, unknown>) =>
    [...saleKeys.groupNode(path), groupBy, filters] as const,
  groupRows: () => [...saleKeys.lists(), "group-rows"] as const,
  /** Every row page of one leaf node. */
  groupRowNode: (path: string) => [...saleKeys.groupRows(), path] as const,
  groupRowPage: (path: string, filters: Record<string, unknown>) =>
    [...saleKeys.groupRowNode(path), filters] as const,
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
 * The TOP level: a page of GROUPS. `meta.total` counts groups, and
 * `aggregate` is the grand total over the whole filtered set — the footer
 * reads that, never a sum of the groups on screen. Idle until a grouping is
 * chosen.
 *
 * The key is `groupLevel("", …)`, exactly what the factory below builds for a
 * request with no path, so the top level of a tree is one cache entry however
 * it is asked for.
 */
export function useSaleGroupsQuery(
  groupBy: SaleGroupBy | null | undefined,
  params: ListParams = {},
  options?: SaleGroupedQueryOptions<SaleGroupPage>
) {
  return useQuery({
    queryKey: saleKeys.groupLevel("", groupBy ?? "", params as Record<string, unknown>),
    queryFn: ({ signal }) => {
      // Unreachable while `enabled` below holds; it is the compiler's
      // narrowing rather than a cast that lies about it.
      if (!groupBy) throw new Error("useSaleGroupsQuery ran without a grouping.");
      return listSaleGroups({ groupBy }, params, { signal });
    },
    placeholderData: keepPreviousData,
    ...options,
    enabled: Boolean(groupBy) && (options?.enabled ?? true),
  });
}

// ---------------------------------------------------------------------------
// Opening nodes of the tree: query OPTIONS, not hooks
// ---------------------------------------------------------------------------
//
// A tree has an unbounded number of open nodes and a hook cannot be called in
// a loop, so the two factories below describe ONE node's request and the
// screen hands an array of them to `useQueries`. The previous shape — a
// component per open group, publishing its rows back into page state through
// an effect — only ever worked one level deep, and at arbitrary depth it is a
// component per node re-rendering the page on every fetch.
//
// Neither factory keeps previous data, unlike the flat and grouped lists: a
// header names what is underneath it, so holding one node's children while
// another's load would file sub-groups or sales under the wrong heading. The
// headers themselves each carry their own label and cannot be misread that
// way, which is why they do keep it.
//
// A node closed (or filtered away) mid-flight aborts through React Query's
// `signal`, which is passed down to `fetch`.

/**
 * One level of sub-groups under `request.path`, counted over that subtree.
 *
 * `aggregate` comes back for every level, but only the TOP level's reaches the
 * footer: a nested level's totals are scoped by the label above them.
 */
export function saleGroupLevelQueryOptions(
  request: SaleGroupLevelRequest,
  params: ListParams = {}
) {
  return queryOptions({
    queryKey: saleKeys.groupLevel(
      request.path ?? "",
      request.groupBy,
      params as Record<string, unknown>
    ),
    queryFn: ({ signal }) => listSaleGroups(request, params, { signal }),
  });
}

/**
 * One page of the rows at the bottom of `path`.
 *
 * Paging lives in `params.page`: the screen keeps every page it has asked for
 * and appends them, so a group header reading 312 can be read to the end
 * instead of standing over 25 rows and no sign that the rest exist.
 */
export function saleGroupRowsQueryOptions(path: string, params: ListParams = {}) {
  return queryOptions({
    queryKey: saleKeys.groupRowPage(path, params as Record<string, unknown>),
    queryFn: ({ signal }) => listSalesInGroup(path, params, { signal }),
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
