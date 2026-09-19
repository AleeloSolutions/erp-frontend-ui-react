/**
 * Sales against `/api/v1/sales/`, plus their payments.
 *
 * The sale is the only customer-facing document: it is quoted, sent,
 * accepted, and paid against. Totals are never sent: the backend computes
 * them from the lines and sends them back, so the form shows what will
 * actually be charged.
 *
 * The `Customer` import is real coupling, not laziness — a sale
 * carries a trimmed copy of the customer it was issued to.
 */

import {
  apiDelete,
  apiFetch,
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type { ApiFetchOptions, Page } from "@/lib/api-client";
import { query, type BranchRef, type ListParams } from "../shared/api";
import type { Customer } from "../customers/api";

export type SaleStatus = "draft" | "sent" | "accepted" | "cancelled";

/** How far the money has come in; the backend derives it from the payments. */
export type PaymentStatus = "not_paid" | "partially_paid" | "paid" | "overdue";

export type LineKind = "product" | "section" | "note";

export interface SaleLine {
  uuid: string;
  position: number;
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  /** The tax's uuid; null on a section or note row. */
  tax: string | null;
  /** What the rate was worth the day it was charged, not what it is now. */
  tax_rate: string;
  line_subtotal: string;
  line_tax_amount: string;
  line_total: string;
}

export interface Sale {
  uuid: string;
  /** Empty until the sale is sent. */
  number: string;
  customer: Pick<Customer, "uuid" | "name" | "email" | "phone" | "currency">;
  branch: BranchRef | null;
  issue_date: string;
  valid_until: string;
  /** When the money falls due; null until the tenant's due days apply. */
  due_date: string | null;
  status: SaleStatus;
  payment_status: PaymentStatus;
  currency: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  customer_reference: string;
  notes: string;
  terms: string;
  salesperson_name: string | null;
  lines: SaleLine[];
  sent_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** One row of the editor's grid. Amounts are absent: the API computes them. */
export interface SaleLineInput {
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  tax: string | null;
}

export interface SalePayment {
  uuid: string;
  amount: string;
  payment_date: string;
  /** The payment method's uuid. */
  payment_method: string;
  reference: string;
  notes: string;
  /** Set once the payment is reversed; a voided row stays on file. */
  voided_at: string | null;
  created_at: string;
}

/** What recording a payment asks for; the rest the backend fills in. */
export interface SalePaymentInput {
  amount: string;
  payment_method: string;
  payment_date?: string;
  reference?: string;
  notes?: string;
}

export interface SaleInput {
  customer: string;
  branch?: string;
  issue_date?: string;
  valid_until?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: string;
  customer_reference?: string;
  notes?: string;
  terms?: string;
  lines?: SaleLineInput[];
}

// ---------------------------------------------------------------------------
// The grouped list: `?group_path=` (where we are) + `?group_by=` (what next)
// ---------------------------------------------------------------------------
//
// One level per request, composing into an Odoo-style tree. `group_path`
// carries the levels already open, outermost first; `group_by` names the one
// further level to group the remainder by. Leave `group_by` off and the same
// path returns the ROWS inside it — the ordinary flat, paginated list — which
// is how a chain of dimensions ends in sales rather than in more headers.
//
//   group_by=salesperson                        level 1: groups
//   group_path=salesperson:U&group_by=customer  level 2: sub-groups
//   group_path=salesperson:U,customer:C         the rows at the bottom
//
// Nothing builds a tree: an unopened branch costs no request at all.

/** The columns the list can be grouped by, server-side. */
export type SaleGroupField =
  "customer" | "branch" | "salesperson" | "status" | "currency" | "issue_date";

export type SaleDateGrain = "day" | "week" | "month" | "quarter" | "year";

/**
 * One level's `group_by` spec.
 *
 * A bare `issue_date` means `issue_date:day`, but this module always sends the
 * explicit spelling: the canonical text is what the server writes into a group
 * path, and what it compares when refusing a grouping nested inside itself —
 * two granularities of `issue_date` being two different groupings, which is
 * exactly what a Year > Quarter > Month chain needs.
 */
export type SaleGroupBy = SaleGroupField | `issue_date:${SaleDateGrain}`;

/**
 * One group row, counted and totalled over every matching sale under it
 * rather than over the rows a page happened to load.
 *
 * `key` is null only where the grouped column itself is null — a sale
 * with no salesperson. `label` is already resolved server-side, so a group
 * row costs no second request, and `path` is the server's own address for
 * this group: send it back as `group_path` to open it.
 */
export interface SaleGroup {
  key: string | null;
  label: string;
  count: number;
  /**
   * Currency code → amount, as a decimal string. Money is PER CURRENCY:
   * a tenant legitimately trades in USD and SOS, and one number spanning
   * both would be arithmetic on two different things.
   */
  totals: Record<string, string>;
  /**
   * What opens THIS group: `group_path=<path>` with a further `group_by=`
   * for its sub-groups, or alone for its rows.
   */
  path: string;
}

/** The grand total over the whole filtered set UNDER THE CURRENT PATH. */
export interface SaleGroupAggregate {
  count: number;
  totals: Record<string, string>;
}

/**
 * What the server says it actually grouped by — not what the panel believes
 * it asked for. A breadcrumb or chip rendered from this cannot drift from the
 * query that produced the rows underneath it.
 */
export interface SaleGroupEcho {
  path: string;
  depth: number;
  group_by: SaleGroupBy | null;
}

/**
 * The grouped envelope. `meta.total` counts GROUPS, so it drives the
 * group pager; `aggregate` describes every matching sale under the current
 * path whatever page is on screen, which is what the grand-total footer must
 * read at the top level. Adding up `data` would print "the total of the groups
 * currently visible".
 */
export interface SaleGroupPage extends Page<SaleGroup> {
  aggregate: SaleGroupAggregate;
  group: SaleGroupEcho;
}

/** The backend's own group page size, so the pager agrees with it. */
export const SALE_GROUP_PAGE_SIZE = 50;

/**
 * Sub-groups per request, at the backend's `?page_size=` cap.
 *
 * Only the TOP level has a pager on screen, so a nested level asks for as many
 * sub-groups as one request can carry and the caller accumulates pages until
 * the server says there are no more. A level that stopped at 50 of 312
 * sub-groups would be the same lie as a header counting 312 above 25 rows.
 */
export const SALE_SUBGROUP_PAGE_SIZE = 100;

/**
 * Rows per request inside an open group — the first page and every Load more.
 *
 * Deliberately its own number rather than the flat list's page size: a group
 * is opened to read what is in it, and 25 of 116 is a group that has to be
 * asked four more times. It is what the Load more button names, so the two
 * cannot drift apart.
 */
export const SALE_GROUP_ROW_PAGE_SIZE = 50;

/** JSON null cannot travel in a query string, so the null group is named. */
export const NULL_GROUP_KEY = "__none__";

/**
 * The `group_path` addressing one node of the tree: the spec of every level
 * above it paired with the key opened at that level.
 *
 * Every group row also carries the server's own `path`, and that string is
 * authoritative. This exists because the table addresses an open node by its
 * group KEYS alone — expanding hands back `[<salesperson uuid>, <customer
 * uuid>]` — so the request for a node has to be derivable from the expansion
 * state and the chosen specs, without a lookup through whichever response
 * happened to mention that node. It is the server's own construction
 * (`SaleGroupingPlan.child_path`): `<spec>:<key>` segments, outermost first,
 * comma-separated, with `__none__` for a group whose key is null. No key any
 * grouping produces contains a comma or a colon, and the server splits a
 * segment at its LAST colon, so a date spec keeps its own —
 * `issue_date:month:2026-03-01`.
 *
 * A `null` key is the group whose own key is null, and becomes the sentinel:
 * callers may pass a `SaleGroup.key` straight in.
 *
 * The server takes a path eight levels deep and refuses a longer one with a
 * 400 naming the limit. Nothing is trimmed here: a chain cut down silently
 * would leave the Group By chip naming levels that were never applied, where
 * a refusal is at least visible in the node that asked for it.
 */
export function saleGroupPathOf(
  specs: readonly SaleGroupBy[],
  keys: readonly (string | null)[]
): string {
  return keys.map((key, level) => `${specs[level]}:${key ?? NULL_GROUP_KEY}`).join(",");
}

export function listSales(params: ListParams = {}): Promise<Page<Sale>> {
  return apiGetPage<Sale>(`/v1/sales/?${query(params)}`);
}

/** One level of the tree: where we already are, and what to open next. */
export interface SaleGroupLevelRequest {
  /**
   * The levels already open — a group's own `path`. Empty at the top level,
   * where there is nothing above the groups being asked for.
   */
  path?: string;
  /** The one further level to group what is left by. */
  groupBy: SaleGroupBy;
}

/**
 * One level of the same list, aggregated in the database: one row per group,
 * counted over every sale under `path` and no wider.
 *
 * Deliberately not `apiGetPage`. That helper returns `Page<T>`, which
 * admits only `data` and `meta` — the `aggregate` block does survive the
 * fetch (the helper already passes `unwrap: false`) but is invisible to
 * every caller, one type away from being lost for good. The footer has to
 * read the server's grand total, so this drops to `apiFetch` and keeps
 * the whole envelope instead of widening the shared helper for one
 * endpoint.
 */
export function listSaleGroups(
  request: SaleGroupLevelRequest,
  params: ListParams = {},
  init?: ApiFetchOptions
): Promise<SaleGroupPage> {
  const search = new URLSearchParams(
    query({ ...params, pageSize: params.pageSize ?? SALE_GROUP_PAGE_SIZE })
  );
  search.set("group_by", request.groupBy);
  if (request.path) search.set("group_path", request.path);
  return apiFetch<SaleGroupPage>(`/v1/sales/?${search.toString()}`, {
    ...init,
    method: "GET",
    unwrap: false,
  });
}

/**
 * The bottom of a chain: the FLAT list again, narrowed to exactly the sales
 * the innermost group counted.
 *
 * The path travels rather than a bare key, so the backend rebuilds every
 * level's predicate from the very definitions that produced the keys and a
 * header can never disagree with the rows behind it — at depth five as much as
 * at depth one. Search, status, date ranges and ordering all still compose
 * (they ride along in `params`), and `params.page` walks the rows inside the
 * group, so a header reading 312 can be read to the end.
 */
export function listSalesInGroup(
  path: string,
  params: ListParams = {},
  init?: ApiFetchOptions
): Promise<Page<Sale>> {
  const search = new URLSearchParams(query(params));
  search.set("group_path", path);
  return apiGetPage<Sale>(`/v1/sales/?${search.toString()}`, init);
}

export function getSale(uuid: string) {
  return apiGet<Sale>(`/v1/sales/${uuid}/`);
}

export function createSale(input: SaleInput) {
  return apiPost<Sale>("/v1/sales/", input);
}

export function updateSale(uuid: string, input: Partial<SaleInput>) {
  return apiPatch<Sale>(`/v1/sales/${uuid}/`, input);
}

export function deleteSale(uuid: string) {
  return apiDelete<void>(`/v1/sales/${uuid}/`);
}

/** Issue the sale: this is what allocates its number. */
export function sendSale(uuid: string) {
  return apiPost<Sale>(`/v1/sales/${uuid}/send/`);
}

/** The customer said yes. Only a sent sale can be accepted. */
export function acceptSale(uuid: string) {
  return apiPost<Sale>(`/v1/sales/${uuid}/accept/`);
}

/** Void a sent or accepted sale. The number stays. */
export function cancelSale(uuid: string) {
  return apiPost<Sale>(`/v1/sales/${uuid}/cancel/`);
}

/** Every payment filed against this sale, voided rows included. */
export function listSalePayments(uuid: string) {
  return apiGet<SalePayment[]>(`/v1/sales/${uuid}/payments/`);
}

/** Recording a payment moves the sale's balance, so the sale comes back. */
export function recordSalePayment(uuid: string, input: SalePaymentInput) {
  return apiPost<Sale>(`/v1/sales/${uuid}/payments/`, input);
}

/** Reverse a payment. The row stays; the balance goes back up. */
export function voidSalePayment(uuid: string, paymentUuid: string) {
  return apiDelete<Sale>(`/v1/sales/${uuid}/payments/${paymentUuid}/`);
}
