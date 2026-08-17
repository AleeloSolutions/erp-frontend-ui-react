import { Settings, X } from "lucide-react";
import { cn } from "../../utils";
import { Dropdown } from "../Dropdown";
import { useUiTranslation } from "../../i18n";
import type { DataTableBulkAction } from "../../types/table";

export interface DataTableBulkActionsProps<TData> {
  selectedCount: number;
  selectedRows: TData[];
  actions?: DataTableBulkAction<TData>[];
  onClear: () => void;
  className?: string;
}

/** “N selected” chip + separate Actions button. Replaces SearchFilter while rows are selected. */
export function DataTableBulkActions<TData>({
  selectedCount,
  selectedRows,
  actions = [],
  onClear,
  className,
}: DataTableBulkActionsProps<TData>) {
  const { t } = useUiTranslation("ui");

  if (selectedCount === 0) return null;

  const actionItems = actions.map((action) => ({
    key: action.key ?? action.label,
    label: action.label,
    danger: action.variant === "danger",
    onClick: () => action.onClick(selectedRows),
  }));

  return (
    <div
      className={cn("mx-auto flex w-fit max-w-full items-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-erp-teal bg-erp-teal-50 px-2.5 text-[11px] text-erp-teal">
        <span>
          <strong className="font-bold">{selectedCount}</strong> {t("datatable.selected")}
        </span>
        <button
          type="button"
          aria-label={t("datatable.clearSelection")}
          className="grid h-4 w-4 place-items-center rounded-sm text-erp-teal hover:bg-erp-teal/10"
          onClick={onClear}
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      </span>
      {actionItems.length > 0 ? (
        <Dropdown
          trigger="button"
          hideChevron
          label={
            <span className="inline-flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" aria-hidden />
              {t("datatable.actions")}
            </span>
          }
          items={actionItems}
          buttonProps={{
            variant: "secondary",
            className: cn(
              "h-9 rounded-md px-2.5 text-[11px] font-bold text-erp-text shadow-none",
              "border border-transparent bg-erp-secondary hover:bg-erp-secondary-hover",
              "aria-expanded:border-erp-teal aria-expanded:bg-erp-teal-50 aria-expanded:text-erp-text",
              "aria-expanded:hover:border-erp-teal aria-expanded:hover:bg-erp-teal-50"
            ),
          }}
        />
      ) : null}
    </div>
  );
}
