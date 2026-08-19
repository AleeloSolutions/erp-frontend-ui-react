import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader, PageSubmenu } from "@/app";
import { DataTable } from "@erp/ui";
import { Button, ConfirmDialog, Drawer, StatusBadge, useToast } from "@erp/ui";
import { salesSubmenu } from "@/modules/sales/manifest";
import { useDeleteQuotationMutation, useQuotationsQuery } from "@/modules/sales/api";
import { useDebounce } from "@erp/ui";
import type { Quotation, QuotationStatus } from "@/modules/sales/api";
import type { DataTableFilter, DataTableFilterValues } from "@erp/ui";
import { MockApiError } from "@/lib/mock";

const STATUS_OPTIONS: QuotationStatus[] = ["Draft", "Pending", "Approved"];

export default function QuotationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = String(filterValues.status ?? "");
  const status = STATUS_OPTIONS.includes(statusFilter as QuotationStatus)
    ? (statusFilter as QuotationStatus)
    : "all";

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      status: status as QuotationStatus | "all",
      page,
      pageSize,
    }),
    [debouncedSearch, status, page, pageSize]
  );

  const quotationsQuery = useQuotationsQuery(listParams);
  const deleteMutation = useDeleteQuotationMutation();

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        placeholder: "All statuses",
        options: STATUS_OPTIONS.map((value) => ({ label: value, value })),
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
        size: 180,
        cell: ({ row, getValue }) => (
          <button
            type="button"
            className="font-bold text-erp-primary hover:underline"
            onClick={() => setDetailQuotation(row.original)}
          >
            {String(getValue())}
          </button>
        ),
      },
      {
        accessorKey: "customer",
        header: "Customer",
        size: 200,
      },
      {
        accessorKey: "date",
        header: "Date",
        size: 120,
      },
      {
        accessorKey: "validUntil",
        header: "Valid until",
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
        size: 110,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        meta: { align: "right" },
        size: 120,
      },
      {
        id: "__actions",
        header: "",
        enableSorting: false,
        size: 52,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${row.original.number}`}
            onClick={() => setPendingDeleteIds([row.original.id])}
          >
            <Trash2 className="h-3.5 w-3.5 text-erp-error" />
          </Button>
        ),
      },
    ],
    []
  );

  async function confirmDelete() {
    try {
      for (const id of pendingDeleteIds) {
        await deleteMutation.mutateAsync(id);
      }
      toast({
        title: pendingDeleteIds.length > 1 ? "Quotations deleted" : "Quotation deleted",
        description: `${pendingDeleteIds.length} record(s) removed.`,
        variant: "success",
      });
      setPendingDeleteIds([]);
      setDetailQuotation(null);
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not delete quotation.";
      toast({ title: "Delete failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks">
      <PageHeader
        module="Sales"
        section="Quotations"
        title="Quotations"
        description="Manage quotations with Query-backed list, confirm delete, and drawer detail."
        icon={<FileText className="h-4 w-4" aria-hidden />}
        actions={
          <Button variant="primary" onClick={() => navigate("/sales/quotations/new")}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Create Quotation
          </Button>
        }
      />

      <PageSubmenu module="Sales" items={salesSubmenu} activeKey="quotations" />

      <DataTable
        tableId="sales-quotations"
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
        ]}
        filters={filters}
        filtering={{
          state: filterValues,
          onChange: (next) => {
            setFilterValues(next);
            setPage(1);
          },
        }}
        selectable
        loading={quotationsQuery.isLoading || quotationsQuery.isFetching}
        error={
          quotationsQuery.isError
            ? quotationsQuery.error.message || "Failed to load quotations"
            : null
        }
        getRowId={(row) => row.id}
        pagination={{
          page,
          pageSize,
          total: quotationsQuery.data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        bulkActions={[
          {
            key: "delete",
            label: "Delete",
            variant: "danger",
            onClick: (rows) => setPendingDeleteIds(rows.map((row) => row.id)),
          },
        ]}
        emptyMessage="No quotations found. Try adjusting filters or create a new quotation."
      />

      <ConfirmDialog
        open={pendingDeleteIds.length > 0}
        title={
          pendingDeleteIds.length > 1
            ? "Delete selected quotations?"
            : "Delete quotation?"
        }
        description="This mock action removes records from the in-memory store."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={() => void confirmDelete()}
      />

      <Drawer
        open={Boolean(detailQuotation)}
        onClose={() => setDetailQuotation(null)}
        title={detailQuotation?.number}
        description="Quotation detail drawer (mock)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailQuotation(null)}>
              Close
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (detailQuotation) {
                  setPendingDeleteIds([detailQuotation.id]);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {detailQuotation ? (
          <dl className="m-0 grid gap-2 text-[12px]">
            <div>
              <dt className="text-erp-subtle">Customer</dt>
              <dd className="m-0 font-bold text-erp-text">{detailQuotation.customer}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Date</dt>
              <dd className="m-0 font-bold text-erp-text">{detailQuotation.date}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Valid until</dt>
              <dd className="m-0 font-bold text-erp-text">
                {detailQuotation.validUntil}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Status</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={detailQuotation.status} />
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Amount</dt>
              <dd className="m-0 font-bold text-erp-text">{detailQuotation.amount}</dd>
            </div>
            <p className="m-0 mt-2 text-[11px] text-erp-muted">
              Need a new record?{" "}
              <Link
                to="/sales/quotations/new"
                className="font-bold text-erp-blue hover:underline"
              >
                Create quotation
              </Link>
            </p>
          </dl>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
