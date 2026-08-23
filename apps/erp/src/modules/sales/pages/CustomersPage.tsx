import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { AppShell, useNavbarDefaults } from "@/app";
import { ControlPanel, DataTable, PageActions } from "@erp/ui";
import { Button, ConfirmDialog, Drawer, StatusBadge, useToast } from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCustomersQuery, useDeleteCustomerMutation } from "@/modules/sales/api";
import { useDebounce } from "@erp/ui";
import type { Customer } from "@/modules/sales/api";
import type { DataTableFilter, DataTableFilterValues } from "@erp/ui";
import { MockApiError } from "@/lib/mock";

export default function CustomersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "customers" });
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = String(filterValues.status ?? "");
  const status =
    statusFilter === "Active" || statusFilter === "Inactive" ? statusFilter : "all";

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      status: status as "all" | "Active" | "Inactive",
      page,
      pageSize,
    }),
    [debouncedSearch, status, page, pageSize]
  );

  const customersQuery = useCustomersQuery(listParams);
  const deleteMutation = useDeleteCustomerMutation();

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        placeholder: "All statuses",
        options: [
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ],
      },
    ],
    []
  );

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        meta: { fill: true },
        size: 220,
        cell: ({ row, getValue }) => (
          <button
            type="button"
            className="font-bold text-erp-primary hover:underline"
            onClick={() => setDetailCustomer(row.original)}
          >
            {String(getValue())}
          </button>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
      },
      {
        accessorKey: "test",
        header: "Test",
        size: 120,
      },
      {
        accessorKey: "phone",
        header: "Phone",
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
        size: 110,
      },
      {
        accessorKey: "created",
        header: "Created",
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
            aria-label={`Delete ${row.original.name}`}
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
        title: pendingDeleteIds.length > 1 ? "Customers deleted" : "Customer deleted",
        description: `${pendingDeleteIds.length} record(s) removed.`,
        variant: "success",
      });
      setPendingDeleteIds([]);
      setDetailCustomer(null);
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not delete customer.";
      toast({ title: "Delete failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="sales-customers"
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
                    onClick: () => navigate("/sales/customers/new"),
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
        data={customersQuery.data?.data ?? []}
        searchable
        searchPlaceholder="Search customers…"
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
        loading={customersQuery.isLoading || customersQuery.isFetching}
        error={
          customersQuery.isError
            ? customersQuery.error.message || "Failed to load customers"
            : null
        }
        getRowId={(row) => row.id}
        pagination={{
          page,
          pageSize,
          total: customersQuery.data?.total ?? 0,
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
        emptyMessage="No customers found. Try adjusting filters or create a new customer."
      />

      <ConfirmDialog
        open={pendingDeleteIds.length > 0}
        title={
          pendingDeleteIds.length > 1 ? "Delete selected customers?" : "Delete customer?"
        }
        description="This mock action removes records from the in-memory store."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={() => void confirmDelete()}
      />

      <Drawer
        open={Boolean(detailCustomer)}
        onClose={() => setDetailCustomer(null)}
        title={detailCustomer?.name}
        description="Customer detail drawer (mock)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailCustomer(null)}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (detailCustomer) {
                  navigate(`/sales/customers/${detailCustomer.id}/edit`);
                }
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (detailCustomer) {
                  setPendingDeleteIds([detailCustomer.id]);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {detailCustomer ? (
          <dl className="m-0 grid gap-2 text-[12px]">
            <div>
              <dt className="text-erp-subtle">Email</dt>
              <dd className="m-0 font-bold text-erp-text">{detailCustomer.email}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Phone</dt>
              <dd className="m-0 font-bold text-erp-text">{detailCustomer.phone}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Status</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={detailCustomer.status} />
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Created</dt>
              <dd className="m-0 font-bold text-erp-text">{detailCustomer.created}</dd>
            </div>
            <p className="m-0 mt-2 text-[11px] text-erp-muted">
              Need a new record?{" "}
              <Link
                to="/sales/customers/new"
                className="font-bold text-erp-blue hover:underline"
              >
                Create customer
              </Link>
            </p>
          </dl>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
