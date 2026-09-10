/**
 * Sales → Invoices, against `/api/v1/sales/invoices/`.
 *
 * The backend does the paging, searching, sorting and filtering, so this
 * asks for one page at a time. Every invoice carries two states — where
 * the document is (draft → posted → cancelled) and where the money is
 * (not paid → paid) — and both are shown, because "posted" says nothing
 * about whether anyone has been paid.
 *
 * Only a draft can be edited or deleted; a posted invoice is a record, so
 * the row menu offers what that invoice's own state actually allows.
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
import { useDeleteInvoiceMutation, useInvoicesQuery } from "../queries";
import type { Invoice } from "../api";
import { ApiError } from "@/lib/api-client";
import { DRAFT_ROW_CLASS_NAME, can } from "@/modules/sales/shared";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATE_LABELS,
  formatMoney,
} from "@/modules/sales/invoices/schema";

/** DataTable sorting -> DRF `?ordering=`; `-` means descending. */
function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "-issue_date";
  return first.desc ? `-${first.id}` : first.id;
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "invoices" });
  const session = useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "issue_date", desc: true },
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pendingDelete, setPendingDelete] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = String(filterValues.status ?? "");
  const paymentFilter = String(filterValues.payment_status ?? "");

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      ordering: orderingOf(sorting),
      page,
      pageSize,
      filters: { status: statusFilter, payment_status: paymentFilter },
    }),
    [debouncedSearch, sorting, page, pageSize, statusFilter, paymentFilter]
  );

  const invoicesQuery = useInvoicesQuery(params);
  const deleteMutation = useDeleteInvoiceMutation();

  const codes = session?.permissions;
  const canCreate = can(codes, "sales.invoice", "create");
  const canEdit = can(codes, "sales.invoice", "edit");
  const canDelete = can(codes, "sales.invoice", "delete");

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        placeholder: "All statuses",
        options: [
          { label: "Draft", value: "draft" },
          { label: "Posted", value: "posted" },
          { label: "Cancelled", value: "cancelled" },
        ],
      },
      {
        key: "payment_status",
        label: "Payment",
        type: "select",
        placeholder: "All payments",
        options: [
          { label: "Not Paid", value: "not_paid" },
          { label: "Partially Paid", value: "partially_paid" },
          { label: "Paid", value: "paid" },
          { label: "Overdue", value: "overdue" },
        ],
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
        size: 160,
        cell: ({ row }) => (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
            onClick={() => setDetailInvoice(row.original)}
          >
            {/* A draft has no number: posting is what allocates one. */}
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
      { accessorKey: "issue_date", header: "Invoice date", size: 120 },
      { accessorKey: "due_date", header: "Due date", size: 120 },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        size: 110,
        cell: ({ row }) => (
          <StatusBadge status={INVOICE_STATUS_LABELS[row.original.status]} />
        ),
      },
      {
        id: "payment_status",
        header: "Payment",
        enableSorting: false,
        size: 130,
        cell: ({ row }) => (
          <StatusBadge status={PAYMENT_STATE_LABELS[row.original.payment_status]} />
        ),
      },
      {
        accessorKey: "total_amount",
        header: "Total",
        meta: { align: "right" },
        size: 130,
        // Decimal strings from the server, printed as they arrived.
        cell: ({ row }) => formatMoney(row.original.total_amount, row.original.currency),
      },
      {
        accessorKey: "balance_amount",
        header: "Balance due",
        meta: { align: "right" },
        size: 130,
        cell: ({ row }) =>
          formatMoney(row.original.balance_amount, row.original.currency),
      },
    ],
    []
  );

  /** A posted invoice can be neither edited nor deleted, so neither is offered. */
  function rowActions(invoice: Invoice): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [
      {
        key: "open",
        label: canEdit && invoice.status === "draft" ? "Edit" : "Open",
        onClick: () => navigate(`/sales/invoices/${invoice.uuid}/edit`),
      },
      {
        key: "print",
        label: "Print",
        onClick: () => navigate(`/sales/invoices/${invoice.uuid}/print`),
      },
    ];
    if (canDelete && invoice.status === "draft") {
      actions.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(invoice),
      });
    }
    return actions;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.uuid);
      toast({ title: "Invoice deleted", variant: "success" });
      setPendingDelete(null);
      setDetailInvoice(null);
    } catch (error) {
      toast({
        title: "Could not delete the invoice",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="sales-invoices"
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
                      onClick: () => navigate("/sales/invoices/new"),
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
        sorting={{
          state: sorting,
          onChange: (next) => {
            setSorting(next);
            setPage(1);
          },
        }}
        loading={invoicesQuery.isLoading || invoicesQuery.isFetching}
        error={invoicesQuery.isError ? invoicesQuery.error.message : null}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        getRowClassName={(invoice) =>
          invoice.status === "draft" ? DRAFT_ROW_CLASS_NAME : undefined
        }
        pagination={{
          page,
          pageSize,
          total: invoicesQuery.data?.meta.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyMessage="No invoices match this search."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this draft?"
        description="It was never issued, so removing it leaves no gap in the numbering. A posted invoice is cancelled instead, never deleted."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />

      <Drawer
        open={Boolean(detailInvoice)}
        onClose={() => setDetailInvoice(null)}
        title={detailInvoice?.number || "Draft invoice"}
        description={detailInvoice?.customer.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailInvoice(null)}>
              Close
            </Button>
            {detailInvoice ? (
              <Button
                variant="secondary"
                onClick={() => navigate(`/sales/invoices/${detailInvoice.uuid}/edit`)}
              >
                Open
              </Button>
            ) : null}
            {detailInvoice && canDelete && detailInvoice.status === "draft" ? (
              <Button variant="danger" onClick={() => setPendingDelete(detailInvoice)}>
                Delete
              </Button>
            ) : null}
          </>
        }
      >
        {detailInvoice ? (
          <dl className="m-0 grid gap-2 text-[12px]">
            <div>
              <dt className="text-erp-subtle">Customer</dt>
              <dd className="m-0 font-bold text-erp-text">
                {detailInvoice.customer.name}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Invoice date</dt>
              <dd className="m-0 font-bold text-erp-text">{detailInvoice.issue_date}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Due date</dt>
              <dd className="m-0 font-bold text-erp-text">{detailInvoice.due_date}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Status</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={INVOICE_STATUS_LABELS[detailInvoice.status]} />
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Payment</dt>
              <dd className="m-0 mt-1">
                <StatusBadge
                  status={PAYMENT_STATE_LABELS[detailInvoice.payment_status]}
                />
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Total</dt>
              <dd className="m-0 font-bold text-erp-text">
                {formatMoney(detailInvoice.total_amount, detailInvoice.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Balance due</dt>
              <dd className="m-0 font-bold text-erp-text">
                {formatMoney(detailInvoice.balance_amount, detailInvoice.currency)}
              </dd>
            </div>
          </dl>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
