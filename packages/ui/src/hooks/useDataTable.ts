import { useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import type {
  DataTableFilterValues,
  DataTableFilteringConfig,
  DataTableSortingConfig,
} from "../types/table";
import { useDebounce } from "./useDebounce";

export interface UseDataTableOptions {
  searchable?: boolean;
  debounceMs?: number;
  sorting?: DataTableSortingConfig;
  filtering?: DataTableFilteringConfig;
  initialPageSize?: number;
}

export function useDataTable({
  searchable = false,
  debounceMs = 250,
  sorting: controlledSorting,
  filtering: controlledFiltering,
  initialPageSize = 10,
}: UseDataTableOptions = {}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, debounceMs);
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalFilters, setInternalFilters] = useState<DataTableFilterValues>(
    {}
  );
  const [pageSize, setPageSize] = useState(initialPageSize);

  const sorting = controlledSorting?.state ?? internalSorting;
  const onSortingChange = controlledSorting?.onChange ?? setInternalSorting;

  const filters = controlledFiltering?.state ?? internalFilters;
  const onFiltersChange = controlledFiltering?.onChange ?? setInternalFilters;

  const hasActiveFilters = useMemo(() => {
    const hasSearch = searchable && debouncedSearch.trim().length > 0;
    const hasFilters = Object.values(filters).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    );
    return hasSearch || hasFilters;
  }, [searchable, debouncedSearch, filters]);

  function clearFilters() {
    setSearch("");
    onFiltersChange({});
  }

  return {
    search,
    setSearch,
    debouncedSearch,
    sorting,
    onSortingChange,
    filters,
    onFiltersChange,
    pageSize,
    setPageSize,
    hasActiveFilters,
    clearFilters,
  };
}
