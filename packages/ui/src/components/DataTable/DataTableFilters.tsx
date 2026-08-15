import { X } from "lucide-react";
import { cn } from "../../utils";
import type { DataTableChip } from "../../types/table";

export interface DataTableFiltersProps {
  chips: DataTableChip[];
  resultCount: number;
  emptyHint?: string;
  onClearAll?: () => void;
  className?: string;
}

export function DataTableFilters({
  chips,
  resultCount,
  emptyHint = "Use search, filters, or grouping to refine the list.",
  onClearAll,
  className,
}: DataTableFiltersProps) {
  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center justify-between gap-2.5 border-b border-erp-border-soft bg-white px-3 py-2",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {chips.length === 0 ? (
          <span className="text-[10.5px] text-erp-subtle">{emptyHint}</span>
        ) : (
          chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#D7E4F0] bg-gradient-to-b from-[#F7FAFE] to-[#EEF4FB] px-2.5 text-[10.5px] font-bold text-[#244E88] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
              aria-label={`Remove ${chip.label} filter`}
            >
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.25px] text-[#6B7C93]">
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
      <span className="inline-flex h-7 items-center rounded-full border border-[#E1E8F0] bg-[#F8FAFC] px-2.5 text-[10.5px] font-bold text-[#667085]">
        {resultCount} result{resultCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
