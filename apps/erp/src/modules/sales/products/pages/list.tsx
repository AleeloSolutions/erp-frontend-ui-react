/**
 * Sales → Products, against `/api/v1/sales/products/`.
 */

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  ConfirmDialog,
  ControlPanel,
  DataTable,
  FormField,
  FormInput,
  Modal,
  Button,
  PageActions,
  StatusBadge,
  useDebounce,
  useToast,
  type DataTableFilter,
  type DataTableFilterValues,
  type DataTableRowAction,
} from "@erp/ui";
import { AppShell } from "@/app";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductsQuery,
} from "../queries";
import type { Product } from "../api";
import { ApiError } from "@/lib/api-client";
import { useSession } from "@/app/session";
import { can, listTableState } from "@/modules/sales/shared";

function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "name";
  return first.desc ? `-${first.id}` : first.id;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useSalesNavbar("products");
  const session = useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickName, setQuickName] = useState("");

  const debouncedSearch = useDebounce(search, 300);
  const archivedFilter = String(filterValues.is_archived ?? "");

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      ordering: orderingOf(sorting),
      page,
      pageSize,
      filters: { is_archived: archivedFilter },
    }),
    [debouncedSearch, sorting, page, pageSize, archivedFilter]
  );

  const productsQuery = useProductsQuery(params);
  const tableState = listTableState(productsQuery);
  const deleteMutation = useDeleteProductMutation();
  const createMutation = useCreateProductMutation();

  const codes = session?.permissions;
  const canCreate = can(codes, "sales.product", "create");
  const canEdit = can(codes, "sales.product", "edit");
  const canDelete = can(codes, "sales.product", "delete");

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "is_archived",
        label: "Status",
        type: "select",
        options: [
          { value: "", label: "All" },
          { value: "false", label: "Active" },
          { value: "true", label: "Archived" },
        ],
      },
    ],
    []
  );

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        meta: { fill: true },
        cell: ({ row }) => {
          const product = row.original;
          return canEdit ? (
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
              onClick={() => navigate(`/sales/products/${product.uuid}/edit`)}
            >
              {product.name}
            </button>
          ) : (
            <span>{product.name}</span>
          );
        },
      },
      {
        accessorKey: "code",
        header: "Code",
        size: 120,
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        accessorKey: "unit_price",
        header: "Unit price",
        size: 110,
      },
      {
        accessorKey: "is_archived",
        header: "Status",
        size: 100,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() ? "Inactive" : "Active"} />
        ),
      },
    ],
    [canEdit, navigate]
  );

  const rowActions = useCallback(
    (product: Product): DataTableRowAction[] => {
      const actions: DataTableRowAction[] = [];
      if (canEdit) {
        actions.push({
          key: "edit",
          label: "Edit",
          onClick: () => navigate(`/sales/products/${product.uuid}/edit`),
        });
      }
      if (canDelete && !product.is_archived) {
        actions.push({
          key: "delete",
          label: "Delete",
          danger: true,
          onClick: () => setPendingDelete(product),
        });
      }
      return actions;
    },
    [canDelete, canEdit, navigate]
  );

  async function handleQuickCreate() {
    const name = quickName.trim();
    if (!name) {
      toast({ title: "Product name is required" });
      return;
    }
    try {
      const created = await createMutation.mutateAsync({ name });
      toast({ title: "Product created", variant: "success" });
      setQuickOpen(false);
      setQuickName("");
      navigate(`/sales/products/${created.uuid}/edit`);
    } catch (err) {
      toast({
        title: "Could not create the product",
        description: err instanceof ApiError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  }

  async function remove(product: Product) {
    try {
      await deleteMutation.mutateAsync(product.uuid);
      toast({ title: "Product deleted", variant: "success" });
      setPendingDelete(null);
    } catch (err) {
      toast({
        title: "Could not delete the product",
        description: err instanceof ApiError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="more" navbar={navbar}>
      <DataTable
        tableId="sales-products"
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
                      onClick: () => setQuickOpen(true),
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
        searchPlaceholder="Search products…"
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
        loading={tableState.loading}
        fetching={tableState.fetching}
        error={tableState.error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={{
          page,
          pageSize,
          total: tableState.total,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyMessage="No products yet."
      />

      <Modal
        open={quickOpen}
        title="New product"
        onClose={() => {
          setQuickOpen(false);
          setQuickName("");
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuickOpen(false);
                setQuickName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={createMutation.isPending}
              onClick={() => void handleQuickCreate()}
            >
              Create
            </Button>
          </div>
        }
      >
        <p className="m-0 mb-3 text-[12px] text-erp-muted">
          Name only for now — you can fill in the rest later.
        </p>
        <FormField label="Name" htmlFor="product-quick-name" required>
          <FormInput
            id="product-quick-name"
            chrome="underline"
            value={quickName}
            autoFocus
            onChange={(event) => setQuickName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleQuickCreate();
              }
            }}
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this product?"
        description={pendingDelete ? `${pendingDelete.name} will be removed.` : ""}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete);
        }}
      />
    </AppShell>
  );
}
