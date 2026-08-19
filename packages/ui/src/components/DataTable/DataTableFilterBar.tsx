import { Search } from "lucide-react";
import { Button } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { Select } from "../../primitives/Select";
import { cn } from "../../utils";
import type {
  DataTableFilter,
  DataTableFilterValues,
  DataTableGroupingOption,
} from "../../types/table";

/**
 * Reusable DataTable filter surface (legacy): search, filters, grouping, Clear.
 * DataTable now composes SearchFilter for search/filter/group UX.
 */
export interface DataTableFilterBarProps {
  searchable?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  filterValues?: DataTableFilterValues;
  onFilterChange?: (key: string, value: string | string[]) => void;
  onClearFilters?: () => void;
  groupingOptions?: DataTableGroupingOption[];
  grouping?: string;
  onGroupingChange?: (value: string) => void;
  className?: string;
}

export function DataTableFilterBar({
  searchable,
  search = "",
  onSearchChange,
  searchPlaceholder = "Search records, names, references, or owners",
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  groupingOptions = [],
  grouping = "",
  onGroupingChange,
  className,
}: DataTableFilterBarProps) {
  return (
    <div
      className={cn(
        "border-b border-erp-border bg-gradient-to-b from-erp-surface-tint-strong to-erp-surface-tint px-3 py-2.5",
        className
      )}
    >
      <div className="grid grid-cols-1 items-end gap-3 min-[1101px]:grid-cols-[minmax(320px,1.3fr)_auto_auto]">
        {searchable ? (
          <div className="min-w-0">
            <span className="mb-1.5 block text-[9.5px] font-extrabold uppercase tracking-[0.45px] text-erp-label">
              Search
            </span>
            <div className="flex h-10 min-w-[260px] items-center gap-2.5 rounded-[10px] border border-erp-border-strong bg-gradient-to-b from-white to-erp-surface-tint-strong px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_1px_2px_rgba(90,28,13,0.06)] focus-within:border-erp-primary max-[720px]:min-w-full">
              <Search className="h-3.5 w-3.5 shrink-0 text-erp-subtle" aria-hidden />
              <Input
                value={search}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label="Search table"
                className="h-auto min-w-0 flex-1 border-0 bg-transparent py-1.5 pl-1.5 pr-1 text-xs shadow-none focus:border-transparent focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-wrap items-end gap-2.5 max-[720px]:grid max-[720px]:grid-cols-2">
          {filters.map((filter) => {
            if (filter.type === "select" || filter.type === "date") {
              return (
                <div key={filter.key} className="min-w-[156px] max-[720px]:min-w-0">
                  <span className="mb-1.5 block text-[9.5px] font-extrabold uppercase tracking-[0.45px] text-erp-label">
                    {filter.label}
                  </span>
                  <Select
                    aria-label={filter.label}
                    className="h-10 w-full min-w-0 rounded-[10px] text-xs"
                    value={String(filterValues[filter.key] ?? "")}
                    onChange={(event) => onFilterChange?.(filter.key, event.target.value)}
                    options={[
                      {
                        label: filter.placeholder ?? `All ${filter.label.toLowerCase()}`,
                        value: "",
                      },
                      ...(filter.options ?? []),
                    ]}
                  />
                </div>
              );
            }

            if (filter.type === "text") {
              return (
                <div key={filter.key} className="min-w-[156px] max-[720px]:min-w-0">
                  <span className="mb-1.5 block text-[9.5px] font-extrabold uppercase tracking-[0.45px] text-erp-label">
                    {filter.label}
                  </span>
                  <Input
                    aria-label={filter.label}
                    className="h-10 w-full min-w-0 rounded-[10px] text-xs"
                    placeholder={filter.placeholder ?? filter.label}
                    value={String(filterValues[filter.key] ?? "")}
                    onChange={(event) => onFilterChange?.(filter.key, event.target.value)}
                  />
                </div>
              );
            }

            if (filter.type === "multi-select" && filter.options) {
              const selected = Array.isArray(filterValues[filter.key])
                ? (filterValues[filter.key] as string[])
                : [];
              return (
                <div key={filter.key} className="min-w-[156px] max-[720px]:min-w-0">
                  <span className="mb-1.5 block text-[9.5px] font-extrabold uppercase tracking-[0.45px] text-erp-label">
                    {filter.label}
                  </span>
                  <Select
                    aria-label={filter.label}
                    className="h-10 w-full min-w-0 rounded-[10px] text-xs"
                    value={selected[0] ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      onFilterChange?.(filter.key, value ? [value] : []);
                    }}
                    options={[
                      {
                        label: filter.placeholder ?? `All ${filter.label.toLowerCase()}`,
                        value: "",
                      },
                      ...filter.options,
                    ]}
                  />
                </div>
              );
            }

            return null;
          })}

          {groupingOptions.length > 0 ? (
            <div className="min-w-[156px] max-[720px]:min-w-0">
              <span className="mb-1.5 block text-[9.5px] font-extrabold uppercase tracking-[0.45px] text-erp-label">
                Group by
              </span>
              <Select
                aria-label="Group by"
                className="h-10 w-full min-w-0 rounded-[10px] text-xs"
                value={grouping}
                onChange={(event) => onGroupingChange?.(event.target.value)}
                options={[{ label: "No grouping", value: "" }, ...groupingOptions]}
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-end justify-end gap-2 max-[720px]:w-full">
          {onClearFilters ? (
            <Button
              variant="secondary"
              className="h-10 rounded-[10px] px-3.5 max-[720px]:w-full"
              onClick={onClearFilters}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Prefer `DataTableFilterBar`. */
export const DataTableToolbar = DataTableFilterBar;
export type DataTableToolbarProps = DataTableFilterBarProps;
