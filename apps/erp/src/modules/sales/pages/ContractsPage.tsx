import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { AppShell, useNavbarDefaults } from "@/app";
import { ControlPanel, DataTable, PageActions } from "@erp/ui";
import { Button, ConfirmDialog, Drawer, StatusBadge, useToast } from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useContractsQuery, useDeleteContractMutation } from "@/modules/sales/api";
import { useDebounce } from "@erp/ui";
import type { Contract } from "@/modules/sales/api";
import type { DataTableFilter, DataTableFilterValues } from "@erp/ui";
import { MockApiError } from "@/lib/mock";
import { draftRowClassNameWhen } from "@/modules/sales/lib/draftRowClassName";

export default function ContractsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "contracts" });
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [detailContract, setDetailContract] = useState<Contract | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = String(filterValues.status ?? "");
  const status =
    statusFilter === "Active" || statusFilter === "Draft" || statusFilter === "Expired"
      ? statusFilter
      : "all";

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      status: status as "all" | "Active" | "Draft" | "Expired",
      page,
      pageSize,
    }),
    [debouncedSearch, status, page, pageSize]
  );

  const contractsQuery = useContractsQuery(listParams);
  const deleteMutation = useDeleteContractMutation();

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        placeholder: "All statuses",
        options: [
          { label: "Active", value: "Active" },
          { label: "Draft", value: "Draft" },
          { label: "Expired", value: "Expired" },
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
        cell: ({ row, getValue }) => (
          <button
            type="button"
            className="hover:underline"
            onClick={() => setDetailContract(row.original)}
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
        accessorKey: "startDate",
        header: "Start date",
        size: 120,
      },
      {
        accessorKey: "endDate",
        header: "End date",
        size: 120,
      },
      {
        accessorKey: "value",
        header: "Value",
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
        size: 110,
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
        title: pendingDeleteIds.length > 1 ? "Contracts deleted" : "Contract deleted",
        description: `${pendingDeleteIds.length} record(s) removed.`,
        variant: "success",
      });
      setPendingDeleteIds([]);
      setDetailContract(null);
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not delete contract.";
      toast({ title: "Delete failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="sales-contracts"
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
                    onClick: () => navigate("/sales/contracts/new"),
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
        selectable
        loading={contractsQuery.isLoading || contractsQuery.isFetching}
        error={
          contractsQuery.isError
            ? contractsQuery.error.message || "Failed to load contracts"
            : null
        }
        getRowId={(row) => row.id}
        getRowClassName={(contract) => draftRowClassNameWhen(contract.status)}
        pagination={{
          page,
          pageSize,
          total: contractsQuery.data?.total ?? 0,
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
        emptyMessage="No contracts found. Try adjusting filters or create a new contract."
      />

      <ConfirmDialog
        open={pendingDeleteIds.length > 0}
        title={
          pendingDeleteIds.length > 1 ? "Delete selected contracts?" : "Delete contract?"
        }
        description="This mock action removes records from the in-memory store."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={() => void confirmDelete()}
      />

      <Drawer
        open={Boolean(detailContract)}
        onClose={() => setDetailContract(null)}
        title={detailContract?.name}
        description="Contract detail drawer (mock)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailContract(null)}>
              Close
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (detailContract) {
                  setPendingDeleteIds([detailContract.id]);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {detailContract ? (
          <dl className="m-0 grid gap-2 text-[12px]">
            <div>
              <dt className="text-erp-subtle">Customer</dt>
              <dd className="m-0 font-bold text-erp-text">{detailContract.customer}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Start date</dt>
              <dd className="m-0 font-bold text-erp-text">{detailContract.startDate}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">End date</dt>
              <dd className="m-0 font-bold text-erp-text">{detailContract.endDate}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Value</dt>
              <dd className="m-0 font-bold text-erp-text">{detailContract.value}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Status</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={detailContract.status} />
              </dd>
            </div>
            <p className="m-0 mt-2 text-[11px] text-erp-muted">
              Need a new record?{" "}
              <Link
                to="/sales/contracts/new"
                className="font-bold text-erp-blue hover:underline"
              >
                Create contract
              </Link>
            </p>
          </dl>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
