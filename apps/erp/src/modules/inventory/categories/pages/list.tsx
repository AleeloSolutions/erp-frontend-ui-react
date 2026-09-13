/**
 * Inventory → Categories, against `/api/v1/inventory/categories/`.
 *
 * The backend does the paging, searching, sorting and filtering, so this
 * asks for one page at a time. Which rows come back is the caller's
 * permission rung, which is why the empty state does not promise there is
 * nothing there.
 */

import { ApiError } from "@/lib/api-client";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
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
import { useCategoriesQuery, useDeleteCategoryMutation } from "../queries";
import type { Category } from "../api";
import { can, listTableState } from "../../shared";

/** DataTable sorting -> DRF `?ordering=`; `-` means descending. */
function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "name";
  return first.desc ? `-${first.id}` : first.id;
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useInventoryNavbar("categories");
  const session = useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const archivedRaw = filterValues.is_archived;
  const archivedFilter = Array.isArray(archivedRaw)
    ? String(archivedRaw[0] ?? "")
    : String(archivedRaw ?? "");

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

  const categoriesQuery = useCategoriesQuery(params);
  const tableState = listTableState(categoriesQuery);
  const deleteMutation = useDeleteCategoryMutation();

  const codes = session?.permissions;
  const canCreate = can(codes, "inventory.category", "create");
  const canEdit = can(codes, "inventory.category", "edit");
  const canDelete = can(codes, "inventory.category", "delete");

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "is_archived",
        label: "Status",
        type: "select",
        placeholder: "All categories",
        options: [
          { label: "Active", value: "false" },
          { label: "Archived", value: "true" },
        ],
      },
    ],
    []
  );

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Category",
        meta: { fill: true },
        size: 280,
        cell: ({ row }) => {
          const category = row.original;
          return (
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
              onClick={() => navigate(`/inventory/categories/${category.uuid}/edit`)}
            >
              {category.name}
            </button>
          );
        },
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
  function rowActions(category: Category): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [
      {
        key: "open",
        label: canEdit ? "Edit" : "Open",
        onClick: () => navigate(`/inventory/categories/${category.uuid}/edit`),
      },
    ];
    if (canDelete) {
      actions.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(category),
      });
    }
    return actions;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.uuid);
      toast({
        title: "Category deleted",
        description: `${pendingDelete.name} was removed.`,
        variant: "success",
      });
      setPendingDelete(null);
    } catch (error) {
      // A category still holding items cannot be deleted; the API says so
      // and the message tells them to archive it instead.
      toast({
        title: "Could not delete the category",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="inventory-categories"
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
                      onClick: () => navigate("/inventory/categories/new"),
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
        searchPlaceholder="Search categories…"
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
        emptyMessage="No categories match this search."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this category?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be removed. A category still holding items cannot be deleted; archive it instead.`
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
