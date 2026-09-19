/**
 * Sales → Sales, against `/api/v1/sales/`.
 *
 * Only a draft can be edited or deleted; once sent it is a record.
 *
 * Grouping is the database's job, not this page's, and it NESTS. The Group By
 * panel is a chain of dimensions, in the order they were picked: the first
 * becomes `?group_by=`, and opening any group re-asks the same endpoint with
 * that group's `?group_path=` plus the NEXT dimension — sub-groups all the way
 * down, and only at the last level the rows themselves. Every level carries
 * counts and totals computed over every matching sale under it, and a group's
 * rows are paged, so a header reading "312 items" can be read to the end.
 * Counting the rows a page happened to load and calling the result a total is
 * the bug this screen is built to avoid; so is a chip naming two dimensions
 * over a list grouped by one.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Button,
  ConfirmDialog,
  ControlPanel,
  DataTable,
  Drawer,
  PageActions,
  PERIOD_GROUP_TREE,
  dataTableGroupKeyId,
  dataTableGroupPathFromId,
  dataTableGroupPathId,
  encodeDateRangesQuery,
  parsePeriodGroupingColumnId,
  periodGroupingOption,
  StatusBadge,
  useDebounce,
  useToast,
  type DataTableFilter,
  type DataTableFilterValues,
  type DataTableGroupingOption,
  type DataTableRowAction,
  type DataTableServerGroupChildGroups,
  type DataTableServerGroupChildRows,
  type DataTableServerGroupLevel,
  type DataTableServerGroupNode,
} from "@erp/ui";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import {
  saleGroupLevelQueryOptions,
  saleGroupRowsQueryOptions,
  saleKeys,
  useDeleteSaleMutation,
  useSaleGroupsQuery,
  useSalesQuery,
} from "../queries";
import {
  SALE_GROUP_PAGE_SIZE,
  SALE_GROUP_ROW_PAGE_SIZE,
  SALE_SUBGROUP_PAGE_SIZE,
  saleGroupPathOf,
  type Sale,
  type SaleGroup,
  type SaleGroupAggregate,
  type SaleGroupBy,
  type SaleGroupPage,
} from "../api";
import { ApiError, type Page } from "@/lib/api-client";
import { DRAFT_ROW_CLASS_NAME, can, listTableState } from "@/modules/sales/shared";
import { SALE_STATUS_LABELS, formatMoney } from "@/modules/sales/sale/schema";

/** The date column the Group By period grains are built over. */
const SALE_DATE_FIELD = "issue_date";

/**
 * What the Group By panel offers, and what a chain can be built from: every
 * dimension the sales endpoint groups by, plus the date grains. Ticking
 * several is a hierarchy in the order they were ticked, so all of them can
 * appear at once. Defined once, outside the component — `DataTable` rebuilds
 * its columns whenever this list changes identity.
 */
const SALE_GROUPING_OPTIONS: DataTableGroupingOption[] = [
  { label: "Salesperson", value: "salesperson" },
  { label: "Customer", value: "customer" },
  { label: "Status", value: "status" },
  { label: "Branch", value: "branch" },
  { label: "Currency", value: "currency" },
  periodGroupingOption("Sale Date", SALE_DATE_FIELD, { defaultExpanded: true }),
];

/**
 * Sub-group pages one node will pull before it stops asking.
 *
 * Only the top level has a pager on screen, so a nested level accumulates its
 * pages until the server says there are no more — a level stopping at the
 * first 100 of 312 sub-groups would be the same lie as a header counting 312
 * above 25 rows. The cap is a guard against a pathological dimension turning
 * one click into a hundred requests, not a page size.
 */
const MAX_SUBGROUP_PAGES = 10;

/**
 * Stable empties. A fresh literal per render would hand `DataTable` a new
 * rows array every time and rebuild its whole row model for nothing.
 */
const NO_SALES: Sale[] = [];
const NO_GROUPS: SaleGroup[] = [];
const NO_SPECS: SaleGroupBy[] = [];
const NO_NODES: SaleGroupNode[] = [];
const NO_PAGE_COUNTS: Record<string, number> = {};
const EMPTY_GROUP_AGGREGATE: SaleGroupAggregate = { count: 0, totals: {} };

function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "-issue_date";
  return first.desc ? `-${first.id}` : first.id;
}

/**
 * A Group By menu id → the backend `group_by` spec.
 *
 * The menu speaks in table column ids (and `__period:<grain>:<field>` for the
 * date grains); the API speaks in `customer`, `status`, `issue_date:month`.
 * Anything this screen does not offer maps to null and is left out of the
 * chain.
 */
function saleGroupSpecOf(columnId: string): SaleGroupBy | null {
  if (
    columnId === "status" ||
    columnId === "customer" ||
    columnId === "salesperson" ||
    columnId === "branch" ||
    columnId === "currency"
  ) {
    return columnId;
  }
  const period = parsePeriodGroupingColumnId(columnId);
  if (period && period.dateField === SALE_DATE_FIELD) {
    return `issue_date:${period.grain}`;
  }
  return null;
}

/** The pill on every group row — the dimension, or the grain for a date. */
function saleGroupLabelOf(spec: SaleGroupBy): string {
  switch (spec) {
    case "status":
      return "Status";
    case "customer":
      return "Customer";
    case "branch":
      return "Branch";
    case "salesperson":
      return "Salesperson";
    case "currency":
      return "Currency";
    case "issue_date":
      return "Day";
    default: {
      const grain = spec.slice("issue_date:".length);
      return PERIOD_GROUP_TREE.find((item) => item.id === grain)?.label ?? "Sale Date";
    }
  }
}

/** Two chains are the same grouping only if they are in the same order. */
function sameSpecs(a: readonly SaleGroupBy[], b: readonly SaleGroupBy[]): boolean {
  return a.length === b.length && a.every((spec, level) => spec === b[level]);
}

/** One node of the tree the user currently has open. */
interface SaleGroupNode {
  /** `dataTableGroupPathId(path)` — how the table addresses this node. */
  pathId: string;
  /** Group keys from the top level down, this node's own key last. */
  path: string[];
  /** The same node as the backend addresses it: `?group_path=`. */
  groupPath: string;
  /** At the last level a node holds sales; above it, sub-groups. */
  holdsRows: boolean;
}

/** One request: which node it belongs to, and which page of it. */
interface SaleNodeQuery {
  pathId: string;
  page: number;
}

interface SaleSubGroupQuery extends SaleNodeQuery {
  options: ReturnType<typeof saleGroupLevelQueryOptions>;
}

interface SaleRowQuery extends SaleNodeQuery {
  options: ReturnType<typeof saleGroupRowsQueryOptions>;
}

/**
 * The sub-group pages of every open branch node, folded into one node each.
 *
 * `incomplete` names the nodes the server still has sub-groups for, which is
 * what drives the next page: the table draws no pager inside a group, so the
 * alternative to asking again is a level that quietly shows some of its
 * children under a parent that counted all of them.
 */
function combineSubGroupNodes(
  queries: readonly SaleSubGroupQuery[],
  results: readonly UseQueryResult<SaleGroupPage, Error>[]
): { nodes: Record<string, DataTableServerGroupChildGroups>; incomplete: string[] } {
  const groupsByPath: Record<string, SaleGroup[]> = {};
  const progress: Record<
    string,
    {
      asked: number;
      loaded: number;
      totalPages: number;
      fetching: boolean;
      error: string | null;
    }
  > = {};

  queries.forEach((query, index) => {
    const result = results[index];
    if (!result) return;
    const state = (progress[query.pathId] ??= {
      asked: 0,
      loaded: 0,
      totalPages: 0,
      fetching: false,
      error: null,
    });
    state.asked += 1;
    const page = result.data;
    if (page) {
      // Pages arrive in the order they were asked for, so appending keeps the
      // server's own ordering of the level.
      (groupsByPath[query.pathId] ??= []).push(...page.data);
      state.loaded += 1;
      state.totalPages = page.meta.total_pages;
    }
    if (result.isFetching) state.fetching = true;
    if (result.isError && !state.error) state.error = result.error.message;
  });

  const nodes: Record<string, DataTableServerGroupChildGroups> = {};
  const incomplete: string[] = [];
  Object.entries(progress).forEach(([pathId, state]) => {
    nodes[pathId] = {
      kind: "groups",
      groups: groupsByPath[pathId] ?? NO_GROUPS,
      // The line sits INSIDE the node, above whatever has already arrived, so
      // a level still filling in never blanks the rest of the tree.
      loading: state.fetching,
      error: state.error,
    };
    if (
      !state.fetching &&
      !state.error &&
      state.loaded > 0 &&
      // Every page asked for has answered: a request still in flight or
      // paused (offline) must not be counted as a level that needs another.
      state.loaded === state.asked &&
      state.loaded < state.totalPages &&
      state.loaded < MAX_SUBGROUP_PAGES
    ) {
      incomplete.push(pathId);
    }
  });
  return { nodes, incomplete };
}

/**
 * The row pages of every open leaf node, appended into one node each.
 *
 * `total` is the server's count for the whole group, not the rows loaded, so
 * the table can say "showing 25 of 312" and offer the rest.
 */
function combineRowNodes(
  queries: readonly SaleRowQuery[],
  results: readonly UseQueryResult<Page<Sale>, Error>[]
): Record<string, DataTableServerGroupChildRows<Sale>> {
  const rowsByPath: Record<string, Sale[]> = {};
  const progress: Record<
    string,
    { total: number; loading: boolean; loadingMore: boolean; error: string | null }
  > = {};

  queries.forEach((query, index) => {
    const result = results[index];
    if (!result) return;
    const state = (progress[query.pathId] ??= {
      total: 0,
      loading: false,
      loadingMore: false,
      error: null,
    });
    const page = result.data;
    if (page) {
      (rowsByPath[query.pathId] ??= []).push(...page.data);
      // The latest page answered carries the freshest count of the group.
      state.total = page.meta.total;
    }
    if (result.isPending) {
      if (query.page === 1) state.loading = true;
      else state.loadingMore = true;
    }
    if (result.isError && !state.error) state.error = result.error.message;
  });

  const nodes: Record<string, DataTableServerGroupChildRows<Sale>> = {};
  Object.entries(progress).forEach(([pathId, state]) => {
    nodes[pathId] = {
      kind: "rows",
      rows: rowsByPath[pathId] ?? NO_SALES,
      loading: state.loading,
      loadingMore: state.loadingMore,
      error: state.error,
      total: state.total,
    };
  });
  return nodes;
}

export default function SalesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useSalesNavbar("sales");
  const session = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "issue_date", desc: true },
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  /**
   * The grouping chain, outermost first — empty while the list is flat. The
   * order is the hierarchy, which is why it is the order the user picked in.
   */
  const [groupSpecs, setGroupSpecs] = useState<SaleGroupBy[]>(NO_SPECS);
  const [groupPage, setGroupPage] = useState(1);
  /** Node path ids `DataTable` currently has open, its own mirror. */
  const [expandedPathIds, setExpandedPathIds] = useState<string[]>([]);
  /** Pages asked for per node: rows by the Load more control, sub-groups by
   * the level itself until the server runs out. */
  const [pageCounts, setPageCounts] = useState<Record<string, number>>(NO_PAGE_COUNTS);
  const [pendingDelete, setPendingDelete] = useState<Sale | null>(null);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusRaw = filterValues.status;
  const statusFilter = Array.isArray(statusRaw)
    ? statusRaw.filter(Boolean).join(",")
    : String(statusRaw ?? "");

  const dateTokens = useMemo(() => {
    const raw = filterValues.issue_date;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw) return [raw];
    return [];
  }, [filterValues.issue_date]);

  const issueDateRanges = useMemo(() => encodeDateRangesQuery(dateTokens), [dateTokens]);

  /**
   * What every request narrows by, flat or grouped and at every depth. A level
   * fetched with different filters from the level above it would count one set
   * and list another.
   */
  const baseParams = useMemo(
    () => ({
      search: debouncedSearch,
      ordering: orderingOf(sorting),
      filters: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(issueDateRanges ? { issue_date_ranges: issueDateRanges } : {}),
      },
    }),
    [debouncedSearch, sorting, statusFilter, issueDateRanges]
  );

  /** The flat list. One page of rows — grouping never changes its size. */
  const listParams = useMemo(
    () => ({ ...baseParams, page, pageSize }),
    [baseParams, page, pageSize]
  );
  /** A page of top-level groups: `meta.total` counts groups, not sales. */
  const groupParams = useMemo(
    () => ({ ...baseParams, page: groupPage, pageSize: SALE_GROUP_PAGE_SIZE }),
    [baseParams, groupPage]
  );

  const grouped = groupSpecs.length > 0;
  const topSpec: SaleGroupBy | null = grouped ? groupSpecs[0] : null;

  const salesQuery = useSalesQuery(listParams, { enabled: !grouped });
  const groupsQuery = useSaleGroupsQuery(topSpec, groupParams);
  const listState = listTableState(salesQuery);
  const deleteMutation = useDeleteSaleMutation();

  /**
   * The grouped envelope read out by hand rather than through
   * `listTableState`: that helper knows `Page<T>` only, and the block this
   * screen most depends on — `aggregate`, the grand total over every matching
   * sale — is exactly the part `Page<T>` has no room for. The empty
   * fallbacks are shared constants so a pending page does not hand the table
   * a new array on every render.
   */
  const groupsPage = groupsQuery.data;
  const groupState = {
    groups: groupsPage?.data ?? NO_GROUPS,
    /** GROUPS in the whole filtered set — this drives the group pager. */
    total: groupsPage?.meta.total ?? 0,
    aggregate: groupsPage?.aggregate ?? EMPTY_GROUP_AGGREGATE,
    loading: groupsQuery.isLoading && !groupsPage,
    fetching: groupsQuery.isFetching && Boolean(groupsPage),
    error: groupsQuery.isError && !groupsPage ? groupsQuery.error.message : null,
  };

  /**
   * The nodes to fetch: every open path that is actually on screen.
   *
   * A path whose parent is closed is skipped — the table keeps it listed so
   * re-opening the parent restores the subtree, but nothing under a collapsed
   * group is visible and fetching it would spend a request on rows nobody can
   * see. A path rooted outside the current page of groups is skipped for the
   * same reason.
   */
  const openNodes = useMemo<SaleGroupNode[]>(() => {
    if (!grouped || expandedPathIds.length === 0) return NO_NODES;
    const open = new Set(expandedPathIds);
    const topLevel = new Set(
      groupState.groups.map((group) => dataTableGroupKeyId(group.key))
    );
    const nodes: SaleGroupNode[] = [];
    expandedPathIds.forEach((pathId) => {
      const path = dataTableGroupPathFromId(pathId);
      if (path.length === 0 || path.length > groupSpecs.length) return;
      if (!topLevel.has(path[0])) return;
      for (let level = 1; level < path.length; level += 1) {
        if (!open.has(dataTableGroupPathId(path.slice(0, level)))) return;
      }
      nodes.push({
        pathId,
        path,
        groupPath: saleGroupPathOf(groupSpecs, path),
        holdsRows: path.length === groupSpecs.length,
      });
    });
    return nodes;
    // `groupState` is rebuilt every render; its `groups` array is not.
  }, [grouped, expandedPathIds, groupSpecs, groupState.groups]);

  /**
   * One request per open node per page asked for — a flat list, because hooks
   * cannot be called in a loop and the tree's shape is whatever the user
   * opened. `useQueries` below turns the list into live results; React Query
   * dedupes, caches and aborts them, so re-opening a branch costs nothing.
   */
  const subGroupQueries = useMemo<SaleSubGroupQuery[]>(() => {
    const queries: SaleSubGroupQuery[] = [];
    openNodes.forEach((node) => {
      if (node.holdsRows) return;
      const pages = pageCounts[node.pathId] ?? 1;
      for (let index = 1; index <= pages; index += 1) {
        queries.push({
          pathId: node.pathId,
          page: index,
          options: saleGroupLevelQueryOptions(
            { path: node.groupPath, groupBy: groupSpecs[node.path.length] },
            { ...baseParams, page: index, pageSize: SALE_SUBGROUP_PAGE_SIZE }
          ),
        });
      }
    });
    return queries;
  }, [openNodes, pageCounts, groupSpecs, baseParams]);

  const rowQueries = useMemo<SaleRowQuery[]>(() => {
    const queries: SaleRowQuery[] = [];
    openNodes.forEach((node) => {
      if (!node.holdsRows) return;
      const pages = pageCounts[node.pathId] ?? 1;
      for (let index = 1; index <= pages; index += 1) {
        queries.push({
          pathId: node.pathId,
          page: index,
          options: saleGroupRowsQueryOptions(node.groupPath, {
            ...baseParams,
            page: index,
            pageSize: SALE_GROUP_ROW_PAGE_SIZE,
          }),
        });
      }
    });
    return queries;
  }, [openNodes, pageCounts, baseParams]);

  /**
   * `combine` rather than reading the results array directly: React Query
   * structurally shares what it returns, so `nodesByPath` keeps its identity
   * while nothing in it changed. Handing `DataTable` a fresh map every render
   * would rebuild its whole row model on every keystroke elsewhere on the page.
   */
  const combineSubGroups = useCallback(
    (results: readonly UseQueryResult<SaleGroupPage, Error>[]) =>
      combineSubGroupNodes(subGroupQueries, results),
    [subGroupQueries]
  );
  const combineRows = useCallback(
    (results: readonly UseQueryResult<Page<Sale>, Error>[]) =>
      combineRowNodes(rowQueries, results),
    [rowQueries]
  );

  const subGroups = useQueries({
    queries: subGroupQueries.map((item) => item.options),
    combine: combineSubGroups,
  });
  const rowNodes = useQueries({
    queries: rowQueries.map((item) => item.options),
    combine: combineRows,
  });

  const nodesByPath = useMemo<Record<string, DataTableServerGroupNode<Sale>>>(
    () => ({ ...subGroups.nodes, ...rowNodes }),
    [subGroups.nodes, rowNodes]
  );

  /**
   * A level the server has more sub-groups for asks for them. It stops at the
   * cap, and at that point the level is showing fewer children than its parent
   * counted — the honest fix is a pager inside the group, which the table does
   * not offer.
   */
  useEffect(() => {
    if (subGroups.incomplete.length === 0) return;
    setPageCounts((prev) => {
      const next = { ...prev };
      let changed = false;
      subGroups.incomplete.forEach((pathId) => {
        const loaded = next[pathId] ?? 1;
        if (loaded >= MAX_SUBGROUP_PAGES) return;
        next[pathId] = loaded + 1;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [subGroups.incomplete]);

  const codes = session?.permissions;
  const canCreate = can(codes, "sales.sale", "create");
  const canEdit = can(codes, "sales.sale", "edit");
  const canDelete = can(codes, "sales.sale", "delete");

  /** Search, filters and sorting re-cut both pagers and every loaded page. */
  const resetPaging = useCallback(() => {
    setPage(1);
    setGroupPage(1);
    setPageCounts((prev) => (prev === NO_PAGE_COUNTS ? prev : NO_PAGE_COUNTS));
  }, []);

  /**
   * The panel's chain, in the order it was picked, is the hierarchy: the first
   * dimension groups the list, the second groups inside the first, and so on.
   * Every dimension the user chose is applied — the old workaround of keeping
   * only the last one is what let the chip name two dimensions over a list
   * grouped by one.
   *
   * The server refuses a dimension repeated inside itself (its child would be
   * a single group identical to its parent), so two panel entries mapping to
   * one spec collapse to one level here rather than making the request a 400.
   */
  const handleGroupingChange = useCallback(
    (columnIds: string[]) => {
      const next: SaleGroupBy[] = [];
      for (const columnId of columnIds) {
        const spec = saleGroupSpecOf(columnId);
        if (spec && !next.includes(spec)) next.push(spec);
      }
      setGroupSpecs((prev) => (sameSpecs(prev, next) ? prev : next));
      setExpandedPathIds((prev) => (prev.length === 0 ? prev : []));
      resetPaging();
    },
    [resetPaging]
  );

  /**
   * The table's own open set, mirrored so the fetch list can be derived from
   * it. It arrives on every toggle, and empty when the table drops expansion
   * wholesale — a new page of groups, or a changed grouping — at which point
   * the accumulated page counts describe nodes that no longer exist.
   */
  const handleExpandedChange = useCallback((pathIds: string[]) => {
    setExpandedPathIds((prev) =>
      prev.length === 0 && pathIds.length === 0 ? prev : pathIds
    );
    if (pathIds.length === 0) {
      setPageCounts((prev) => (prev === NO_PAGE_COUNTS ? prev : NO_PAGE_COUNTS));
    }
  }, []);

  /**
   * The table's fetch trigger, which this screen does not need: the set of
   * open paths IS the request list (see `openNodes`), and a node coming back
   * on screen is served from the cache because its key never changed.
   */
  const handleNodeExpand = useCallback(() => {}, []);

  /** One more page of an open group's rows, appended to the ones on screen. */
  const loadMoreGroupRows = useCallback((path: string[]) => {
    const pathId = dataTableGroupPathId(path);
    setPageCounts((prev) => ({ ...prev, [pathId]: (prev[pathId] ?? 1) + 1 }));
  }, []);

  /**
   * Re-issue one node's request after it failed.
   *
   * Addressed by the node's own `group_path`, which is the key prefix both its
   * sub-group pages and its row pages hang off: only one of the two namespaces
   * holds anything for a given node, so refetching both asks for exactly what
   * is there.
   */
  const retryGroupNode = useCallback(
    (path: string[]) => {
      if (groupSpecs.length === 0) return;
      const groupPath = saleGroupPathOf(groupSpecs, path);
      void queryClient.refetchQueries({ queryKey: saleKeys.groupNode(groupPath) });
      void queryClient.refetchQueries({ queryKey: saleKeys.groupRowNode(groupPath) });
    },
    [queryClient, groupSpecs]
  );

  /** One entry per level, so every group row is labelled by its dimension. */
  const groupLevels = useMemo<DataTableServerGroupLevel[]>(
    () => groupSpecs.map((spec) => ({ id: spec, label: saleGroupLabelOf(spec) })),
    [groupSpecs]
  );

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "multi-select",
        placeholder: "All statuses",
        options: [
          { label: "Draft", value: "draft" },
          { label: "Pending", value: "sent" },
          { label: "Approved", value: "accepted" },
          { label: "Cancelled", value: "cancelled" },
        ],
      },
      {
        key: "issue_date",
        label: "Create Date",
        type: "date-presets",
        dateField: "issue_date",
      },
    ],
    []
  );

  const columns = useMemo<ColumnDef<Sale>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Sale",
        meta: { fill: true },
        size: 160,
        cell: ({ row }) => (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
            onClick={() => setDetailSale(row.original)}
          >
            {row.original.number || "Draft"}
          </button>
        ),
      },
      {
        id: "customer",
        accessorFn: (row) => row.customer.name,
        header: "Customer",
        enableSorting: false,
        size: 200,
        cell: ({ row }) => row.original.customer.name,
      },
      { accessorKey: "issue_date", header: "Date", size: 120 },
      { accessorKey: "valid_until", header: "Valid until", size: 120 },
      {
        id: "status",
        accessorFn: (row) => SALE_STATUS_LABELS[row.status],
        header: "Status",
        enableSorting: false,
        size: 110,
        cell: ({ row }) => (
          <StatusBadge status={SALE_STATUS_LABELS[row.original.status]} />
        ),
      },
      {
        accessorKey: "total_amount",
        header: "Total",
        meta: { align: "right" },
        size: 130,
        cell: ({ row }) => formatMoney(row.original.total_amount, row.original.currency),
      },
    ],
    []
  );

  const rowActions = useCallback(
    (sale: Sale): DataTableRowAction[] => {
      const actions: DataTableRowAction[] = [
        {
          key: "open",
          label: canEdit && sale.status === "draft" ? "Edit" : "Open",
          onClick: () => navigate(`/sales/${sale.uuid}/edit`),
        },
      ];
      if (canDelete && sale.status === "draft") {
        actions.push({
          key: "delete",
          label: "Delete",
          danger: true,
          onClick: () => setPendingDelete(sale),
        });
      }
      return actions;
    },
    [canDelete, canEdit, navigate]
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.uuid);
      toast({ title: "Sale deleted", variant: "success" });
      setPendingDelete(null);
      setDetailSale(null);
    } catch (error) {
      toast({
        title: "Could not delete the sale",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="sales-sales"
        renderToolbar={({ searchFilter, pagination }) => (
          <ControlPanel
            pageActions={
              canCreate ? (
                <PageActions
                  buttons={[
                    {
                      key: "new",
                      children: "New Sale",
                      variant: "primary",
                      size: "sm",
                      onClick: () => navigate("/sales/new"),
                    },
                  ]}
                />
              ) : undefined
            }
            endSlot={pagination}
          >
            {searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        // Grouped, every row arrives inside the node that was opened for it.
        data={grouped ? NO_SALES : listState.rows}
        searchable
        searchPlaceholder="Search sales…"
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            resetPaging();
          },
        }}
        manualFiltering
        enableGrouping
        groupingOptions={SALE_GROUPING_OPTIONS}
        onGroupingChange={handleGroupingChange}
        serverGrouping={
          topSpec
            ? {
                groups: groupState.groups,
                // The server's grand total over the WHOLE filtered set. Adding
                // up `groups` would print the total of the 50 groups on screen,
                // and a nested level's totals belong to its own header.
                aggregate: groupState.aggregate,
                loading: groupState.loading,
                error: groupState.error,
                onExpandedChange: handleExpandedChange,
                groupLabel: saleGroupLabelOf(topSpec),
                formatAmount: formatMoney,
                // The rows one Load more asks for, so the label says the truth.
                rowPageSize: SALE_GROUP_ROW_PAGE_SIZE,
                nesting: {
                  levels: groupLevels,
                  nodesByPath,
                  onExpand: handleNodeExpand,
                  onRetry: retryGroupNode,
                  onLoadMore: loadMoreGroupRows,
                },
                pagination: {
                  page: groupPage,
                  pageSize: SALE_GROUP_PAGE_SIZE,
                  // Groups, not sales — `meta.total` counts the group rows.
                  total: groupState.total,
                  onPageChange: setGroupPage,
                },
              }
            : undefined
        }
        filters={filters}
        filtering={{
          state: filterValues,
          onChange: (next) => {
            setFilterValues(next);
            resetPaging();
          },
        }}
        sorting={{
          state: sorting,
          onChange: (next) => {
            setSorting(next);
            resetPaging();
          },
        }}
        loading={grouped ? false : listState.loading}
        fetching={grouped ? groupState.fetching : listState.fetching}
        error={grouped ? null : listState.error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        getRowClassName={(sale) =>
          sale.status === "draft" ? DRAFT_ROW_CLASS_NAME : undefined
        }
        pagination={{
          page,
          pageSize,
          total: listState.total,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            resetPaging();
          },
        }}
        emptyMessage="No sales match this search."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this draft?"
        description="It was never sent, so removing it leaves no gap in the numbering. A sent sale is cancelled instead, never deleted."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />

      <Drawer
        open={Boolean(detailSale)}
        onClose={() => setDetailSale(null)}
        title={detailSale?.number || "Draft sale"}
        description={detailSale?.customer.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailSale(null)}>
              Close
            </Button>
            {detailSale ? (
              <Button
                variant="secondary"
                onClick={() => navigate(`/sales/${detailSale.uuid}/edit`)}
              >
                {canEdit && detailSale.status === "draft" ? "Edit" : "Open"}
              </Button>
            ) : null}
            {detailSale && canDelete && detailSale.status === "draft" ? (
              <Button variant="danger" onClick={() => setPendingDelete(detailSale)}>
                Delete
              </Button>
            ) : null}
          </>
        }
      >
        {detailSale ? (
          <dl className="m-0 grid gap-2 text-[12px]">
            <div>
              <dt className="text-erp-subtle">Customer</dt>
              <dd className="m-0 font-bold text-erp-text">{detailSale.customer.name}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Date</dt>
              <dd className="m-0 font-bold text-erp-text">{detailSale.issue_date}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Valid until</dt>
              <dd className="m-0 font-bold text-erp-text">{detailSale.valid_until}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Status</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={SALE_STATUS_LABELS[detailSale.status]} />
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Total</dt>
              <dd className="m-0 font-bold text-erp-text">
                {formatMoney(detailSale.total_amount, detailSale.currency)}
              </dd>
            </div>
          </dl>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
