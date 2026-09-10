/**
 * Sales → Contracts, against `/api/v1/sales/contracts/`.
 *
 * Header-only (v1): no lines, no document number. Only a draft is ever
 * hard-deleted; anything past draft is archived instead, same rule as an
 * invoice or quotation.
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
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { useContractsQuery, useDeleteContractMutation } from "../queries";
import type { Contract } from "../api";
import { ApiError } from "@/lib/api-client";
import { can } from "@/modules/sales/shared";
import { CONTRACT_STATUS_LABELS, formatMoney } from "@/modules/sales/contracts/schema";

function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "-start_date";
  return first.desc ? `-${first.id}` : first.id;
}

export default function ContractsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useSalesNavbar("contracts");
  const session = useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "start_date", desc: true },
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pendingDelete, setPendingDelete] = useState<Contract | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = String(filterValues.status ?? "");

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      ordering: orderingOf(sorting),
      page,
      pageSize,
      filters: { status: statusFilter },
    }),
    [debouncedSearch, sorting, page, pageSize, statusFilter]
  );

  const contractsQuery = useContractsQuery(params);
  const deleteMutation = useDeleteContractMutation();

  const codes = session?.permissions;
  const canCreate = can(codes, "sales.contract", "create");
  const canEdit = can(codes, "sales.contract", "edit");
  const canDelete = can(codes, "sales.contract", "delete");

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        placeholder: "All statuses",
        options: [
          { label: "Draft", value: "draft" },
          { label: "Active", value: "active" },
          { label: "Expired", value: "expired" },
        ],
      },
    ],
    []
  );

  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Contract",
        meta: { fill: true },
        size: 220,
        cell: ({ row }) => (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
            onClick={() => navigate(`/sales/contracts/${row.original.uuid}/edit`)}
          >
            {row.original.name}
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
      { accessorKey: "start_date", header: "Start date", size: 120 },
      { accessorKey: "end_date", header: "End date", size: 120 },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        size: 110,
        cell: ({ row }) => (
          <StatusBadge status={CONTRACT_STATUS_LABELS[row.original.status]} />
        ),
      },
      {
        accessorKey: "value_amount",
        header: "Value",
        meta: { align: "right" },
        size: 130,
        cell: ({ row }) =>
          formatMoney(row.original.value_amount, row.original.customer.currency),
      },
    ],
    [navigate]
  );

  function rowActions(contract: Contract): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [
      {
        key: "open",
        label: canEdit ? "Edit" : "Open",
        onClick: () => navigate(`/sales/contracts/${contract.uuid}/edit`),
      },
    ];
    if (canDelete && contract.status === "draft") {
      actions.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(contract),
      });
    }
    return actions;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.uuid);
      toast({ title: "Contract deleted", variant: "success" });
      setPendingDelete(null);
    } catch (error) {
      toast({
        title: "Could not delete the contract",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="sales-contracts"
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
                      onClick: () => navigate("/sales/contracts/new"),
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
        data={contractsQuery.data?.data ?? []}
        searchable
        searchPlaceholder="Search contracts…"
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
        loading={contractsQuery.isLoading || contractsQuery.isFetching}
        error={contractsQuery.isError ? contractsQuery.error.message : null}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={{
          page,
          pageSize,
          total: contractsQuery.data?.meta.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyMessage="No contracts match this search."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this draft?"
        description="It was never activated, so removing it leaves nothing behind. An active or expired contract is archived instead, never deleted."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AppShell>
  );
}
