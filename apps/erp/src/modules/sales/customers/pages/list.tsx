/**
 * Sales → Customers, against `/api/v1/sales/customers/`.
 *
 * The backend does the paging, searching, sorting and filtering, so this
 * asks for one page at a time and never holds the tenant in memory. Which
 * rows come back is the caller's permission rung: somebody on the branch
 * rung sees their branch's customers and nothing else, which is why the
 * empty state does not promise there is nothing there.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  ConfirmDialog,
  ControlPanel,
  DataTable,
  PageActions,
  StatusBadge,
  useDebounce,
  useToast,
  type DataTableFilter,
  type DataTableFilterValues,
  type DataTableRowAction,
} from "@erp/ui";
import { AppShell, useNavbarDefaults } from "@/app";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCustomersQuery, useDeleteCustomerMutation } from "../queries";
import type { Customer } from "../api";
import { ApiError } from "@/lib/api-client";
import { useSession } from "@/app/session";
import { can } from "@/modules/sales/shared";

/** DataTable sorting -> DRF `?ordering=`; `-` means descending. */
function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "name";
  return first.desc ? `-${first.id}` : first.id;
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "customers" });
  const session = useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const archivedFilter = String(filterValues.is_archived ?? "");
  const typeFilter = String(filterValues.customer_type ?? "");

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      ordering: orderingOf(sorting),
      page,
      pageSize,
      filters: { is_archived: archivedFilter, customer_type: typeFilter },
    }),
    [debouncedSearch, sorting, page, pageSize, archivedFilter, typeFilter]
  );

  const customersQuery = useCustomersQuery(params);
  const deleteMutation = useDeleteCustomerMutation();

  const codes = session?.permissions;
  const canCreate = can(codes, "sales.customer", "create");
  const canEdit = can(codes, "sales.customer", "edit");
  const canDelete = can(codes, "sales.customer", "delete");

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "customer_type",
        label: "Type",
        type: "select",
        placeholder: "All types",
        options: [
          { label: "Organization", value: "organization" },
          { label: "Person", value: "person" },
        ],
      },
      {
        key: "is_archived",
        label: "Status",
        type: "select",
        placeholder: "All customers",
        options: [
          { label: "Active", value: "false" },
          { label: "Archived", value: "true" },
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
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
              onClick={() => navigate(`/sales/customers/${customer.uuid}/edit`)}
            >
              {customer.name}
            </button>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
        cell: ({ getValue }) => String(getValue() || "—"),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        size: 130,
        cell: ({ getValue }) => String(getValue() || "—"),
      },
      {
        accessorKey: "city",
        header: "City",
        size: 130,
        cell: ({ getValue }) => String(getValue() || "—"),
      },
      {
        id: "branch",
        header: "Branch",
        enableSorting: false,
        size: 120,
        cell: ({ row }) => row.original.branch?.name ?? "—",
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        size: 110,
        cell: ({ row }) => (
          <StatusBadge status={row.original.is_archived ? "Archived" : "Active"} />
        ),
      },
    ],
    [navigate]
  );

  /** Only the actions this viewer may actually perform are offered. */
  function rowActions(customer: Customer): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [
      {
        key: "open",
        label: canEdit ? "Edit" : "Open",
        onClick: () => navigate(`/sales/customers/${customer.uuid}/edit`),
      },
    ];
    if (canDelete) {
      actions.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(customer),
      });
    }
    return actions;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.uuid);
      toast({
        title: "Customer deleted",
        description: `${pendingDelete.name} was removed.`,
        variant: "success",
      });
      setPendingDelete(null);
    } catch (error) {
      // A customer with invoices can never be deleted; the API says so and
      // the message tells them to archive instead.
      toast({
        title: "Could not delete the customer",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="sales-customers"
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
                      onClick: () => navigate("/sales/customers/new"),
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
        sorting={{
          state: sorting,
          onChange: (next) => {
            setSorting(next);
            setPage(1);
          },
        }}
        loading={customersQuery.isLoading || customersQuery.isFetching}
        error={customersQuery.isError ? customersQuery.error.message : null}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={{
          page,
          pageSize,
          total: customersQuery.data?.meta.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyMessage="No customers match this search."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this customer?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be removed. A customer with invoices cannot be deleted; archive them instead.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AppShell>
  );
}
