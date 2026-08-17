import { cn } from "../../utils";
import type { ReactNode } from "react";

export interface DataTableFiltersProps {
  /** Right-side controls (Sort, Columns). Chips live in SearchFilter. */
  toolbarEnd?: ReactNode;
  className?: string;
}

/** Compact meta strip above the table (Sort + Columns). Empty when no toolbarEnd. */
export function DataTableFilters({ toolbarEnd, className }: DataTableFiltersProps) {
  if (!toolbarEnd) return null;

  return (
    <div
      className={cn(
        "flex min-h-8 flex-wrap items-center justify-end gap-2 border-b border-erp-border-soft bg-erp-surface px-3 py-1.5",
        className
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {toolbarEnd}
      </div>
    </div>
  );
}
