import type { ReactNode } from "react";
import { cn } from "../../utils";

export interface ControlPanelProps {
  /** Left slot — typically PageActions (New button + title + gear) */
  pageActions?: ReactNode;
  /** Center slot — typically SearchFilter or BulkActions */
  children?: ReactNode;
  /** Right slot — typically pagination */
  endSlot?: ReactNode;
  className?: string;
}

export function ControlPanel({
  pageActions,
  children,
  endSlot,
  className,
}: ControlPanelProps) {
  return (
    <div
      className={cn(
        "relative z-20 overflow-visible border-b border-erp-table-border bg-erp-table-header px-3 pt-2 pb-3 bg-white",
        className
      )}
    >
      <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center">{pageActions}</div>
        <div className="flex min-w-0 items-center justify-center">{children}</div>
        <div className="flex min-w-0 items-center justify-end">{endSlot}</div>
      </div>
    </div>
  );
}
