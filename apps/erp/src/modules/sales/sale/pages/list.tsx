/**
 * Sales → Sales, against `/api/v1/sales/`.
 *
 * Only a draft can be edited or deleted; once sent it is a record.
 *
 * Grouping is the database's job, not this page's. Choosing a Group By
 * dimension switches the screen to `?group_by=<spec>`, which returns a page
 * of GROUPS counted and totalled over every matching sale; opening one asks
 * for that group's rows with `&group_key=`. The flat list keeps fetching one
 * ordinary page whatever the grouping is — counting a page of rows and
 * calling the result a total is the bug this screen is built to avoid.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Button,
  ConfirmDialog,
  ControlPanel,
  DataTable,
  Drawer,
  PageActions,
  PERIOD_GROUP_TREE,
  dataTableGroupKeyFromId,
  encodeDateRangesQuery,
  parsePeriodGroupingColumnId,
  periodGroupingOption,
  StatusBadge,
  useDebounce,
  useToast,
  type DataTableFilter,
  type DataTableFilterValues,
  type DataTableRowAction,
  type DataTableServerGroupRows,
} from "@erp/ui";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import {
  saleKeys,
  useDeleteSaleMutation,
  useSaleGroupRowsQuery,
  useSaleGroupsQuery,
  useSalesQuery,
} from "../queries";
import {
  SALE_GROUP_PAGE_SIZE,
  type Sale,
  type SaleGroup,
  type SaleGroupAggregate,
  type SaleGroupBy,
} from "../api";
import { ApiError } from "@/lib/api-client";
import {
  DRAFT_ROW_CLASS_NAME,
  can,
  listTableState,
  type ListParams,
} from "@/modules/sales/shared";
import { SALE_STATUS_LABELS, formatMoney } from "@/modules/sales/sale/schema";

/** The date column the Group By period grains are built over. */
const SALE_DATE_FIELD = "issue_date";

/**
 * Stable empties. A fresh literal per render would hand `DataTable` a new
 * rows array every time and rebuild its whole row model for nothing.
 */
const NO_SALES: Sale[] = [];
const NO_GROUPS: SaleGroup[] = [];
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
 * Anything this screen does not offer maps to null and leaves the list flat.
 */
function saleGroupSpecOf(columnId: string): SaleGroupBy | null {
  if (columnId === "status" || columnId === "customer") return columnId;
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

interface SaleGroupRowsProps {
  groupBy: SaleGroupBy;
  /** `dataTableGroupKeyId(group.key)` — `__none__` for the null group. */
  identity: string;
  params: ListParams;
  onRows: (identity: string, entry: DataTableServerGroupRows<Sale>) => void;
  onGone: (identity: string) => void;
}

/**
 * One opened group's rows, fetched with the same search, filters and ordering
 * as the group headers so a header can never disagree with the rows under it.
 *
 * It renders nothing. `useSaleGroupRowsQuery` fetches exactly one group and a
 * hook cannot be called in a loop, so every open group gets its own component
 * and publishes what it holds back to the page.
 */
function SaleGroupRows({
  groupBy,
  identity,
  params,
  onRows,
  onGone,
}: SaleGroupRowsProps) {
  const query = useSaleGroupRowsQuery(groupBy, dataTableGroupKeyFromId(identity), params);
  const rows = query.data?.data ?? NO_SALES;
  const total = query.data?.meta.total ?? 0;
  const loading = query.isPending || query.isFetching;
  const error = query.isError ? query.error.message : null;

  useEffect(() => {
    onRows(identity, { rows, loading, error, total });
  }, [onRows, identity, rows, loading, error, total]);

  // Collapsing unmounts this. Drop the entry with it, so re-opening the group
  // cannot flash rows fetched under a search or filter that has since changed.
  useEffect(() => () => onGone(identity), [onGone, identity]);

  return null;
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
  /** The backend `group_by` spec, or null while the list is flat. */
  const [groupSpec, setGroupSpec] = useState<SaleGroupBy | null>(null);
  const [groupPage, setGroupPage] = useState(1);
  /** Group identities `DataTable` currently has open. */
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [groupRowsByKey, setGroupRowsByKey] = useState<
    Record<string, DataTableServerGroupRows<Sale>>
  >({});
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

  /** What every one of the three requests narrows by, grouped or not. */
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
  /** A page of groups: `meta.total` counts groups, not sales. */
  const groupParams = useMemo(
    () => ({ ...baseParams, page: groupPage, pageSize: SALE_GROUP_PAGE_SIZE }),
    [baseParams, groupPage]
  );
  /** One group's rows: the first page of them, at the list's own page size. */
  const groupRowParams = useMemo(
    () => ({ ...baseParams, page: 1, pageSize }),
    [baseParams, pageSize]
  );

  const grouped = groupSpec !== null;

  const salesQuery = useSalesQuery(listParams, { enabled: !grouped });
  const groupsQuery = useSaleGroupsQuery(groupSpec, groupParams);
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

  const codes = session?.permissions;
  const canCreate = can(codes, "sales.sale", "create");
  const canEdit = can(codes, "sales.sale", "edit");
  const canDelete = can(codes, "sales.sale", "delete");

  /** Search, filters and sorting all re-cut both pagers. */
  const resetPaging = useCallback(() => {
    setPage(1);
    setGroupPage(1);
  }, []);

  /**
   * The panel allows several dimensions at once; `group_by` takes exactly one,
   * so the most recent choice wins — every click changes what is on screen
   * rather than silently doing nothing.
   */
  const handleGroupingChange = useCallback(
    (columnIds: string[]) => {
      let next: SaleGroupBy | null = null;
      for (const columnId of columnIds) {
        const spec = saleGroupSpecOf(columnId);
        if (spec) next = spec;
      }
      setGroupSpec(next);
      resetPaging();
    },
    [resetPaging]
  );

  const handleGroupRows = useCallback(
    (identity: string, entry: DataTableServerGroupRows<Sale>) => {
      setGroupRowsByKey((prev) => {
        const current = prev[identity];
        if (
          current &&
          current.rows === entry.rows &&
          current.loading === entry.loading &&
          current.error === entry.error &&
          current.total === entry.total
        ) {
          return prev;
        }
        return { ...prev, [identity]: entry };
      });
    },
    []
  );

  const handleGroupRowsGone = useCallback((identity: string) => {
    setGroupRowsByKey((prev) => {
      if (!(identity in prev)) return prev;
      const next = { ...prev };
      delete next[identity];
      return next;
    });
  }, []);

  /**
   * Re-issue one group's row request after it failed.
   *
   * Matched by key prefix: `saleKeys.groupRow` files a group under
   * `groupKey ?? "__none__"`, and the table addresses the null group by the
   * same `__none__` identity, so the identity is already the key segment. The
   * filters tail is left off deliberately — only the mounted group is
   * fetching, and it is the one to retry.
   */
  const retryGroupRows = useCallback(
    (identity: string) => {
      if (!groupSpec) return;
      void queryClient.refetchQueries({
        queryKey: [...saleKeys.groupRows(), groupSpec, identity],
      });
    },
    [queryClient, groupSpec]
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
        // Grouped, the rows come per opened group; the table is fed those.
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
        groupingOptions={[
          { label: "Status", value: "status" },
          { label: "Customer", value: "customer" },
          periodGroupingOption("Sale Date", SALE_DATE_FIELD, { defaultExpanded: true }),
        ]}
        onGroupingChange={handleGroupingChange}
        serverGrouping={
          groupSpec
            ? {
                groups: groupState.groups,
                // The server's grand total over the WHOLE filtered set. Adding
                // up `groups` would print the total of the 50 groups on screen.
                aggregate: groupState.aggregate,
                loading: groupState.loading,
                error: groupState.error,
                rowsByGroup: groupRowsByKey,
                onExpandedChange: setExpandedGroups,
                onRetryGroup: retryGroupRows,
                groupLabel: saleGroupLabelOf(groupSpec),
                formatAmount: formatMoney,
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

      {groupSpec
        ? expandedGroups.map((identity) => (
            <SaleGroupRows
              key={identity}
              groupBy={groupSpec}
              identity={identity}
              params={groupRowParams}
              onRows={handleGroupRows}
              onGone={handleGroupRowsGone}
            />
          ))
        : null}

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
