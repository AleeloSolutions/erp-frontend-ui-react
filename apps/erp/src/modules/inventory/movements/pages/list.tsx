/**
 * Inventory → Movements, against `/api/v1/inventory/movements/`.
 *
 * Filters: Type · Date (Sales date-presets) · Item · Quantity (smart min/max).
 * Group By: Type · Item · Date (Year → Day), same tree as Sales quotations.
 */

import { app } from "@kaabe/runtime";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  ControlPanel,
  DataTable,
  PageActions,
  StatusBadge,
  encodeDateRangesQuery,
  periodGroupingOption,
  useDebounce,
  type DataTableFilter,
  type DataTableFilterValues,
} from "@erp/ui";
import { useInventoryNavbar } from "../../useInventoryNavbar";
import { useMovementFacetsQuery, useMovementsQuery } from "../queries";
import type { StockMovement } from "../api";
import { MOVEMENT_TYPE_LABELS } from "../schema";
import { buildQuantityBuckets } from "../quantityBuckets";
import { can, listTableState } from "../../shared";

function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "-created_at";
  return first.desc ? `-${first.id}` : first.id;
}

function selectedValues(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

export default function MovementsPage() {
  const navigate = useNavigate();
  const navbar = useInventoryNavbar("movements");
  const session = app.useSession();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [periodGroupingActive, setPeriodGroupingActive] = useState(false);
  const knownTotalRef = useRef<number | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const typeFilters = selectedValues(filterValues.movement_type);
  const quantityFilters = selectedValues(filterValues.quantity_ranges);

  const dateTokens = useMemo(
    () => selectedValues(filterValues.created_at),
    [filterValues.created_at]
  );
  const createdAtRanges = useMemo(
    () => encodeDateRangesQuery(dateTokens),
    [dateTokens]
  );

  const listPageSize =
    periodGroupingActive && (knownTotalRef.current ?? 0) > 0
      ? Math.max(pageSize, 200)
      : pageSize;

  const params = useMemo(() => {
    const filters: Record<string, string | string[]> = {};
    if (typeFilters.length) filters.movement_type = typeFilters;
    if (createdAtRanges) filters.created_at_ranges = createdAtRanges;
    if (quantityFilters.length) {
      filters.quantity_ranges = quantityFilters.join("|");
    }
    return {
      search: debouncedSearch,
      ordering: orderingOf(sorting),
      page,
      pageSize: listPageSize,
      filters,
    };
  }, [
    debouncedSearch,
    sorting,
    page,
    listPageSize,
    typeFilters,
    createdAtRanges,
    quantityFilters,
  ]);

  const movementsQuery = useMovementsQuery(params);
  const tableState = listTableState(movementsQuery);
  if (movementsQuery.isSuccess) {
    knownTotalRef.current = movementsQuery.data.meta.total;
  }

  const facetsQuery = useMovementFacetsQuery();

  const canCreate = can(session?.permissions, "inventory.movement", "create");

  const quantityOptions = useMemo(
    () =>
      buildQuantityBuckets(
        facetsQuery.data?.quantity_min,
        facetsQuery.data?.quantity_max
      ),
    [facetsQuery.data?.quantity_min, facetsQuery.data?.quantity_max]
  );

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "movement_type",
        label: "Type",
        type: "select",
        placeholder: "All types",
        options: [
          { label: "Stock in", value: "in" },
          { label: "Stock out", value: "out" },
          { label: "Adjustment", value: "adjust" },
        ],
      },
      {
        key: "created_at",
        label: "Date",
        type: "date-presets",
        dateField: "created_at",
      },
      ...(quantityOptions.length > 0
        ? [
            {
              key: "quantity_ranges",
              label: "Quantity",
              type: "select" as const,
              placeholder: "All quantities",
              options: quantityOptions,
            },
          ]
        : []),
    ],
    [quantityOptions]
  );

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Date",
        size: 160,
        cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
      },
      {
        id: "item",
        accessorFn: (row) =>
          row.item.sku ? `${row.item.name} (${row.item.sku})` : row.item.name,
        header: "Item",
        enableSorting: false,
        meta: { fill: true },
        size: 220,
      },
      {
        accessorKey: "movement_type",
        header: "Type",
        enableSorting: false,
        size: 120,
        cell: ({ row }) => (
          <StatusBadge status={MOVEMENT_TYPE_LABELS[row.original.movement_type]} />
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qty",
        size: 100,
        meta: { align: "right" },
      },
      {
        id: "before_after",
        header: "Before → After",
        enableSorting: false,
        size: 140,
        cell: ({ row }) =>
          `${row.original.quantity_before} → ${row.original.quantity_after}`,
      },
      {
        accessorKey: "note",
        header: "Note",
        enableSorting: false,
        size: 200,
        cell: ({ row }) => row.original.note || "—",
      },
    ],
    []
  );

  return (
    <app.AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="inventory-movements"
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
                      onClick: () => navigate("/inventory/movements/new"),
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
        searchPlaceholder="Search movements…"
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
          { label: "Type", value: "movement_type" },
          { label: "Item", value: "item" },
          periodGroupingOption("Date", "created_at", { defaultExpanded: true }),
        ]}
        onGroupingChange={(columnIds) => {
          const wantsPeriod = columnIds.some((id) => id.startsWith("__period:"));
          const total =
            movementsQuery.data?.meta.total ?? knownTotalRef.current ?? 0;
          const next = wantsPeriod && total > 0;
          setPeriodGroupingActive((prev) => {
            if (prev !== next) setPage(1);
            return next;
          });
        }}
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
        emptyMessage="No stock movements match this search."
      />
    </app.AppShell>
  );
}
