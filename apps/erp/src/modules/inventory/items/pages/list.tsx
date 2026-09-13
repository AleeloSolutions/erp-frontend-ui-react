/**
 * Inventory → Items, against `/api/v1/inventory/items/`.
 *
 * The backend does the paging, searching, sorting and filtering, so this
 * asks for one page at a time and never holds the catalogue in memory.
 * Which rows come back is the caller's permission rung: somebody on the
 * branch rung sees their branch's items and nothing else, which is why
 * the empty state does not promise there is nothing there.
 */

import { api, app } from "@kaabe/runtime";
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
import { useInventoryNavbar } from "../../useInventoryNavbar";
import { useCategoriesQuery } from "../../categories";
import { useDeleteItemMutation, useItemsQuery } from "../queries";
import { isLowStock } from "../schema";
import type { Item } from "../api";
import { can, listTableState } from "../../shared";

/** DataTable sorting -> DRF `?ordering=`; `-` means descending. */
function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "name";
  return first.desc ? `-${first.id}` : first.id;
}

export default function ItemsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useInventoryNavbar("items");
  const session = app.useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const archivedRaw = filterValues.is_archived;
  const categoryRaw = filterValues.category;
  const archivedFilter = Array.isArray(archivedRaw)
    ? String(archivedRaw[0] ?? "")
    : String(archivedRaw ?? "");
  const categoryFilter = Array.isArray(categoryRaw)
    ? String(categoryRaw[0] ?? "")
    : String(categoryRaw ?? "");

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      ordering: orderingOf(sorting),
      page,
      pageSize,
      filters: { is_archived: archivedFilter, category: categoryFilter },
    }),
    [debouncedSearch, sorting, page, pageSize, archivedFilter, categoryFilter]
  );

  const itemsQuery = useItemsQuery(params);
  const tableState = listTableState(itemsQuery);
  const deleteMutation = useDeleteItemMutation();

  // One page of categories feeds the filter; a tenant past this many needs
  // a server-backed search.
  const categoriesQuery = useCategoriesQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });

  const codes = session?.permissions;
  const canCreate = can(codes, "inventory.item", "create");
  const canEdit = can(codes, "inventory.item", "edit");
  const canDelete = can(codes, "inventory.item", "delete");

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "category",
        label: "Category",
        type: "select",
        placeholder: "All categories",
        options: (categoriesQuery.data?.data ?? []).map((category) => ({
          label: category.name,
          value: category.uuid,
        })),
      },
      {
        key: "is_archived",
        label: "Status",
        type: "select",
        placeholder: "All items",
        options: [
          { label: "Active", value: "false" },
          { label: "Archived", value: "true" },
        ],
      },
    ],
    [categoriesQuery.data]
  );

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Item",
        meta: { fill: true },
        size: 220,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
              onClick={() => navigate(`/inventory/items/${item.uuid}/edit`)}
            >
              {item.name}
            </button>
          );
        },
      },
      {
        accessorKey: "sku",
        header: "SKU",
        size: 140,
        cell: ({ getValue }) => String(getValue() || "—"),
      },
      {
        id: "category",
        header: "Category",
        enableSorting: false,
        size: 150,
        cell: ({ row }) => row.original.category?.name ?? "—",
      },
      {
        accessorKey: "quantity",
        header: "Qty on hand",
        meta: { align: "right" },
        size: 120,
        // Decimal strings from the server, printed as they arrived. Low
        // stock is coloured rather than badged: it is a reading of the
        // number, not a separate state the record is in.
        cell: ({ row }) => {
          const item = row.original;
          const low = isLowStock(item.quantity, item.reorder_level);
          return (
            <span className={low ? "tabular-nums text-erp-error" : "tabular-nums"}>
              {item.quantity}
            </span>
          );
        },
      },
      {
        accessorKey: "sale_price",
        header: "Sale price",
        meta: { align: "right" },
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{String(getValue())}</span>
        ),
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
  function rowActions(item: Item): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [
      {
        key: "open",
        label: canEdit ? "Edit" : "Open",
        onClick: () => navigate(`/inventory/items/${item.uuid}/edit`),
      },
    ];
    if (canDelete) {
      actions.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(item),
      });
    }
    return actions;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.uuid);
      toast({
        title: "Item deleted",
        description: `${pendingDelete.name} was removed.`,
        variant: "success",
      });
      setPendingDelete(null);
    } catch (error) {
      // An item with stock movements can never be deleted; the API says
      // so and the message tells them to archive it instead.
      toast({
        title: "Could not delete the item",
        description: error instanceof api.ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <app.AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="inventory-items"
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
                      onClick: () => navigate("/inventory/items/new"),
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
        searchPlaceholder="Search items…"
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
        emptyMessage="No items match this search."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this item?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be removed. An item with stock movements cannot be deleted; archive it instead.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </app.AppShell>
  );
}
