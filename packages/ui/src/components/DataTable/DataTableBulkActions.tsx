import { Button } from "../../primitives/Button";
import { cn } from "../../utils";
import type { DataTableBulkAction } from "../../types/table";

export interface DataTableBulkActionsProps<TData> {
  selectedCount: number;
  selectedRows: TData[];
  actions?: DataTableBulkAction<TData>[];
  className?: string;
}

export function DataTableBulkActions<TData>({
  selectedCount,
  selectedRows,
  actions = [],
  className,
}: DataTableBulkActionsProps<TData>) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex min-h-10 items-center gap-2 border-b border-[#C9D8E8] bg-gradient-to-b from-[#F1F7FD] to-[#E9F2FB] px-3 py-1.5",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <strong className="text-[11px] text-erp-blue">{selectedCount} selected</strong>
      {actions.map((action) => (
        <Button
          key={action.key ?? action.label}
          variant={action.variant ?? "secondary"}
          onClick={() => action.onClick(selectedRows)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
