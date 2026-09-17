import type { ReactNode } from "react";
import { cn } from "../../utils";
import { NAVBAR_HEIGHT } from "../stickyOffsets";

export interface ControlPanelProps {
  /** Left slot — typically PageActions (New button + title + gear) */
  pageActions?: ReactNode;
  /** Center slot — typically SearchFilter or BulkActions */
  children?: ReactNode;
  /** Right slot — typically pagination */
  endSlot?: ReactNode;
  /**
   * Tighter vertical padding for breadcrumb-only bars (form pages above a
   * FormStatusBar). Defaults to true when `children` and `endSlot` are empty.
   */
  compact?: boolean;
  /**
   * When false, the panel is not sticky on its own — use inside
   * `FormStickyHeader` so it shares one sticky layer with FormStatusBar.
   */
  sticky?: boolean;
  className?: string;
}

export function ControlPanel({
  pageActions,
  children,
  endSlot,
  compact,
  sticky = true,
  className,
}: ControlPanelProps) {
  const isCompact = compact ?? (children == null && endSlot == null);

  return (
    <div
      data-control-panel
      data-compact={isCompact ? "" : undefined}
      style={sticky ? { top: NAVBAR_HEIGHT } : undefined}
      className={cn(
        "overflow-visible border-b border-erp-table-border bg-white px-3",
        sticky && "sticky z-20",
        // Compact: tight top, small bottom so FormStatusBar isn't cramped against the border.
        isCompact ? "pt-1 pb-1.5" : "pt-2 pb-3",
        className
      )}
    >
      <div
        className={cn(
          // The side tracks take only what their content needs; the search in
          // the middle gets everything else. Equal thirds capped it at a third
          // of the panel, so a search with several facets grew downward into
          // stacked rows while most of the toolbar sat empty.
          "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3",
          isCompact && "min-h-7"
        )}
      >
        <div className="flex min-w-0 items-center">{pageActions}</div>
        <div className="flex min-w-0 items-center justify-center overflow-visible">
          {children}
        </div>
        <div className="flex min-w-0 items-center justify-end">{endSlot}</div>
      </div>
    </div>
  );
}
