/**
 * Sales → Sales, against `/api/v1/sales/`.
 *
 * Only a draft can be edited or deleted; once sent it is a record.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Button,
  ConfirmDialog,
  ControlPanel,
  DataTable,
  Drawer,
  PageActions,
  encodeDateRangesQuery,
  periodGroupingOption,
  StatusBadge,
  useDebounce,
  useToast,
  type DataTableFilter,
  type DataTableFilterValues,
  type DataTableRowAction,
} from "@erp/ui";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { useDeleteSaleMutation, useSalesQuery } from "../queries";
import type { Sale } from "../api";
import { ApiError } from "@/lib/api-client";
import { DRAFT_ROW_CLASS_NAME, can, listTableState } from "@/modules/sales/shared";
import {
  SALE_STATUS_LABELS,
  formatMoney,
  sumMoneyByCurrency,
} from "@/modules/sales/sale/schema";

function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "-issue_date";
  return first.desc ? `-${first.id}` : first.id;
}

export default function SalesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useSalesNavbar("sales");
  const session = useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "issue_date", desc: true },
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [periodGroupingActive, setPeriodGroupingActive] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Sale | null>(null);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  /** Last successful unfiltered-or-filtered total — used to avoid period page bumps on empty. */
  const knownTotalRef = useRef<number | null>(null);

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

  /** Period group-by needs enough rows to nest; never bump when the catalog is empty. */
  const listPageSize =
    periodGroupingActive && (knownTotalRef.current ?? 0) > 0
      ? Math.max(pageSize, 200)
      : pageSize;

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      ordering: orderingOf(sorting),
      page,
      pageSize: listPageSize,
      filters: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(issueDateRanges ? { issue_date_ranges: issueDateRanges } : {}),
      },
    }),
    [debouncedSearch, sorting, page, listPageSize, statusFilter, issueDateRanges]
  );

  const salesQuery = useSalesQuery(params);
  const tableState = listTableState(salesQuery);
  if (salesQuery.isSuccess) {
    knownTotalRef.current = salesQuery.data.meta.total;
  }
  const deleteMutation = useDeleteSaleMutation();

  const codes = session?.permissions;
  const canCreate = can(codes, "sales.sale", "create");
  const canEdit = can(codes, "sales.sale", "edit");
  const canDelete = can(codes, "sales.sale", "delete");

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
        data={tableState.rows}
        searchable
        searchPlaceholder="Search sales…"
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        manualFiltering
        enableGrouping
        groupingOptions={[
          { label: "Status", value: "status" },
          { label: "Customer", value: "customer" },
          periodGroupingOption("Sale Date", "issue_date", { defaultExpanded: true }),
        ]}
        onGroupingChange={(columnIds) => {
          const wantsPeriod = columnIds.some((id) => id.startsWith("__period:"));
          const total = tableState.total || knownTotalRef.current || 0;
          // Empty catalog: keep grouping visual client-side, but do not refetch.
          const next = wantsPeriod && total > 0;
          setPeriodGroupingActive((prev) => {
            if (prev !== next) setPage(1);
            return next;
          });
        }}
        filters={filters}
        filtering={{
          state: filterValues,
          onChange: (next) => {
            setFilterValues(next);
            setPage(1);
          },
        }}
        sorting={{
          state: sorting,
          onChange: (next) => {
            setSorting(next);
            setPage(1);
          },
        }}
        loading={tableState.loading}
        fetching={tableState.fetching}
        error={tableState.error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        getRowClassName={(sale) =>
          sale.status === "draft" ? DRAFT_ROW_CLASS_NAME : undefined
        }
        renderGroupSummary={({ rows }) => sumMoneyByCurrency(rows)}
        pagination={{
          page,
          pageSize: listPageSize,
          total: tableState.total,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
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
