import { X } from "lucide-react";
import { cn } from "../../utils";
import type { DataTableChip } from "../../types/table";

export interface FilterBarProps {
  chips: DataTableChip[];
  emptyHint?: string;
  onClearAll?: () => void;
  className?: string;
}

/** Standalone chip strip for active filters (SearchFilter embeds chips in DataTable). */
export function FilterBar({
  chips,
  emptyHint = "Use search, filters, or grouping to refine the list.",
  onClearAll,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-2.5 border-b border-erp-border-soft bg-white px-3 py-2",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {chips.length === 0 ? (
          <span className="text-[10.5px] text-erp-subtle">{emptyHint}</span>
        ) : (
          chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-erp-border-chip bg-gradient-to-b from-erp-surface-hover to-erp-blue-50 px-2.5 text-[10.5px] font-bold text-erp-blue shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
              aria-label={`Remove ${chip.label} filter`}
            >
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.25px] text-erp-muted">
                {chip.label}
              </span>
              <span className="text-erp-blue">{chip.value}</span>
              <X className="h-3 w-3 opacity-70" aria-hidden />
            </button>
          ))
        )}
        {chips.length > 0 && onClearAll ? (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[10.5px] font-bold text-erp-blue hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
