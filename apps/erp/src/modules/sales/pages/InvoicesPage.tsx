import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { AppShell, useNavbarDefaults } from "@/app";
import { ControlPanel, DataTable, PageActions } from "@erp/ui";
import { Button, ConfirmDialog, Drawer, StatusBadge, useToast } from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useDeleteInvoiceMutation, useInvoicesQuery } from "@/modules/sales/api";
import { useDebounce } from "@erp/ui";
import type { Invoice, InvoiceStatus } from "@/modules/sales/api";
import type { DataTableFilter, DataTableFilterValues } from "@erp/ui";
import { MockApiError } from "@/lib/mock";

const STATUS_OPTIONS: InvoiceStatus[] = ["Draft", "Posted"];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "invoices" });
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = String(filterValues.status ?? "");
  const status = STATUS_OPTIONS.includes(statusFilter as InvoiceStatus)
    ? (statusFilter as InvoiceStatus)
    : "all";

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      status: status as InvoiceStatus | "all",
      page,
      pageSize,
    }),
    [debouncedSearch, status, page, pageSize]
  );

  const invoicesQuery = useInvoicesQuery(listParams);
  const deleteMutation = useDeleteInvoiceMutation();

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

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Invoice",
        meta: { fill: true },
        size: 180,
        cell: ({ row, getValue }) => (
          <button
            type="button"
            className="font-bold text-erp-primary hover:underline"
            onClick={() => setDetailInvoice(row.original)}
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
        header: "Invoice date",
        size: 120,
      },
      {
        accessorKey: "dueDate",
        header: "Due date",
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
        size: 100,
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
        size: 130,
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
        title: pendingDeleteIds.length > 1 ? "Invoices deleted" : "Invoice deleted",
        description: `${pendingDeleteIds.length} record(s) removed.`,
        variant: "success",
      });
      setPendingDeleteIds([]);
      setDetailInvoice(null);
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not delete invoice.";
      toast({ title: "Delete failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="sales-invoices"
        renderToolbar={({ searchFilter, pagination, bulkActions }) => (
          <ControlPanel
            pageActions={
              <PageActions
                buttons={[
                  {
                    key: "new",
                    children: "New",
                    variant: "primary",
                    size: "sm",
                    onClick: () => navigate("/sales/invoices/new"),
                  },
                ]}
              />
            }
            endSlot={pagination}
          >
            {bulkActions ?? searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        data={invoicesQuery.data?.data ?? []}
        searchable
        searchPlaceholder="Search invoices…"
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        manualFiltering
        filters={filters}
        filtering={{
          state: filterValues,
          onChange: (next) => {
            setFilterValues(next);
            setPage(1);
          },
        }}
        selectable
        loading={invoicesQuery.isLoading || invoicesQuery.isFetching}
        error={
          invoicesQuery.isError
            ? invoicesQuery.error.message || "Failed to load invoices"
            : null
        }
        getRowId={(row) => row.id}
        pagination={{
          page,
          pageSize,
          total: invoicesQuery.data?.total ?? 0,
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
        emptyMessage="No invoices found. Try adjusting filters or create a new invoice."
      />

      <ConfirmDialog
        open={pendingDeleteIds.length > 0}
        title={
          pendingDeleteIds.length > 1 ? "Delete selected invoices?" : "Delete invoice?"
        }
        description="This mock action removes records from the in-memory store."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={() => void confirmDelete()}
      />

      <Drawer
        open={Boolean(detailInvoice)}
        onClose={() => setDetailInvoice(null)}
        title={detailInvoice?.number}
        description="Invoice detail drawer (mock)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailInvoice(null)}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (detailInvoice) {
                  navigate(`/sales/invoices/${detailInvoice.id}/edit`);
                }
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (detailInvoice) {
                  setPendingDeleteIds([detailInvoice.id]);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {detailInvoice ? (
          <dl className="m-0 grid gap-2 text-[12px]">
            <div>
              <dt className="text-erp-subtle">Customer</dt>
              <dd className="m-0 font-bold text-erp-text">{detailInvoice.customer}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Invoice date</dt>
              <dd className="m-0 font-bold text-erp-text">{detailInvoice.date}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Due date</dt>
              <dd className="m-0 font-bold text-erp-text">{detailInvoice.dueDate}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Status</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={detailInvoice.status} />
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Payment</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={detailInvoice.paymentStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Amount</dt>
              <dd className="m-0 font-bold text-erp-text">{detailInvoice.amount}</dd>
            </div>
            <p className="m-0 mt-2 text-[11px] text-erp-muted">
              Need a new record?{" "}
              <Link
                to="/sales/invoices/new"
                className="font-bold text-erp-blue hover:underline"
              >
                Create invoice
              </Link>
            </p>
          </dl>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
