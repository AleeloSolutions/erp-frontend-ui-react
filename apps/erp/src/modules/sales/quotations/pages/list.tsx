/**
 * Sales → Quotations, against `/api/v1/sales/quotations/`.
 *
 * Only a draft can be edited or deleted; once sent it is a record.
 */

import { useMemo, useState } from "react";
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
import { AppShell, useNavbarDefaults } from "@/app";
import { useSession } from "@/app/session";
import { salesNavbar } from "@/modules/sales/manifest";
import { useDeleteQuotationMutation, useQuotationsQuery } from "../queries";
import type { Quotation } from "../api";
import { ApiError } from "@/lib/api-client";
import { DRAFT_ROW_CLASS_NAME, can } from "@/modules/sales/shared";
import { QUOTATION_STATUS_LABELS, formatMoney } from "@/modules/sales/quotations/schema";

function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "-issue_date";
  return first.desc ? `-${first.id}` : first.id;
}

export default function QuotationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "quotations" });
  const session = useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "issue_date", desc: true },
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [periodGroupingActive, setPeriodGroupingActive] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Quotation | null>(null);
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusRaw = filterValues.status;
  const statusFilter = Array.isArray(statusRaw)
    ? String(statusRaw[0] ?? "")
    : String(statusRaw ?? "");

  const dateTokens = useMemo(() => {
    const raw = filterValues.issue_date;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw) return [raw];
    return [];
  }, [filterValues.issue_date]);

  const issueDateRanges = useMemo(
    () => encodeDateRangesQuery(dateTokens),
    [dateTokens]
  );

  /** Period group-by needs enough rows from the filtered set to nest meaningfully. */
  const listPageSize = periodGroupingActive ? Math.max(pageSize, 200) : pageSize;

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

  const quotationsQuery = useQuotationsQuery(params);
  const deleteMutation = useDeleteQuotationMutation();

  const codes = session?.permissions;
  const canCreate = can(codes, "sales.quotation", "create");
  const canEdit = can(codes, "sales.quotation", "edit");
  const canDelete = can(codes, "sales.quotation", "delete");

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
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

  const columns = useMemo<ColumnDef<Quotation>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Quotation",
        meta: { fill: true },
        size: 160,
        cell: ({ row }) => (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
            onClick={() => setDetailQuotation(row.original)}
          >
            {row.original.number || "Draft"}
          </button>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        enableSorting: false,
        size: 200,
        cell: ({ row }) => row.original.customer.name,
      },
      { accessorKey: "issue_date", header: "Date", size: 120 },
      { accessorKey: "valid_until", header: "Valid until", size: 120 },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        size: 110,
        cell: ({ row }) => (
          <StatusBadge status={QUOTATION_STATUS_LABELS[row.original.status]} />
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

  function rowActions(quotation: Quotation): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [
      {
        key: "open",
        label: canEdit && quotation.status === "draft" ? "Edit" : "Open",
        onClick: () => navigate(`/sales/quotations/${quotation.uuid}/edit`),
      },
    ];
    if (canDelete && quotation.status === "draft") {
      actions.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(quotation),
      });
    }
    return actions;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.uuid);
      toast({ title: "Quotation deleted", variant: "success" });
      setPendingDelete(null);
      setDetailQuotation(null);
    } catch (error) {
      toast({
        title: "Could not delete the quotation",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="sales-quotations"
        renderToolbar={({ searchFilter, pagination }) => (
          <ControlPanel
            pageActions={
              canCreate ? (
                <PageActions
                  buttons={[
                    {
                      key: "new",
                      children: "New",
                      variant: "primary",
                      size: "sm",
                      onClick: () => navigate("/sales/quotations/new"),
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
        data={quotationsQuery.data?.data ?? []}
        searchable
        searchPlaceholder="Search quotations…"
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
          periodGroupingOption("Order Date", "issue_date", { defaultExpanded: true }),
        ]}
        onGroupingChange={(columnIds) => {
          const next = columnIds.some((id) => id.startsWith("__period:"));
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
        loading={quotationsQuery.isLoading || quotationsQuery.isFetching}
        error={quotationsQuery.isError ? quotationsQuery.error.message : null}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        getRowClassName={(quotation) =>
          quotation.status === "draft" ? DRAFT_ROW_CLASS_NAME : undefined
        }
        pagination={{
          page,
          pageSize: listPageSize,
          total: quotationsQuery.data?.meta.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyMessage="No quotations match this search."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this draft?"
        description="It was never sent, so removing it leaves no gap in the numbering. A sent quotation is cancelled instead, never deleted."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />

      <Drawer
        open={Boolean(detailQuotation)}
        onClose={() => setDetailQuotation(null)}
        title={detailQuotation?.number || "Draft quotation"}
        description={detailQuotation?.customer.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailQuotation(null)}>
              Close
            </Button>
            {detailQuotation ? (
              <Button
                variant="secondary"
                onClick={() => navigate(`/sales/quotations/${detailQuotation.uuid}/edit`)}
              >
                {canEdit && detailQuotation.status === "draft" ? "Edit" : "Open"}
              </Button>
            ) : null}
            {detailQuotation && canDelete && detailQuotation.status === "draft" ? (
              <Button variant="danger" onClick={() => setPendingDelete(detailQuotation)}>
                Delete
              </Button>
            ) : null}
          </>
        }
      >
        {detailQuotation ? (
          <dl className="m-0 grid gap-2 text-[12px]">
            <div>
              <dt className="text-erp-subtle">Customer</dt>
              <dd className="m-0 font-bold text-erp-text">
                {detailQuotation.customer.name}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Date</dt>
              <dd className="m-0 font-bold text-erp-text">
                {detailQuotation.issue_date}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Valid until</dt>
              <dd className="m-0 font-bold text-erp-text">
                {detailQuotation.valid_until}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Status</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={QUOTATION_STATUS_LABELS[detailQuotation.status]} />
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Total</dt>
              <dd className="m-0 font-bold text-erp-text">
                {formatMoney(detailQuotation.total_amount, detailQuotation.currency)}
              </dd>
            </div>
          </dl>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
