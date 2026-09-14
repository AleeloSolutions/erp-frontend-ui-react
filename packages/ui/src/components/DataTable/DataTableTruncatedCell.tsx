import { cn } from "../../utils";
import type { ReactNode } from "react";

function getTooltipText(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

/** Truncate + ellipsis on plain text and link/button cell content. */
const truncateDescendantClasses = [
  "[&_button]:block [&_button]:max-w-full [&_button]:min-w-0 [&_button]:truncate [&_button]:text-start",
  "[&_a]:block [&_a]:max-w-full [&_a]:min-w-0 [&_a]:truncate",
  "[&>*]:min-w-0 [&>*]:max-w-full",
];

export interface DataTableTruncatedCellProps {
  children: ReactNode;
  /** Row value — used for tooltip when present. */
  value?: unknown;
  className?: string;
}

/**
 * Ellipsis wrapper with a native title from the cell value.
 *
 * No ResizeObserver: measuring every cell on mount was the main post-load
 * cost on every DataTable (dozens of observers + sync layout reads). CSS
 * truncate still clips; the browser shows `title` on hover when set.
 */
export function DataTableTruncatedCell({
  children,
  value,
  className,
}: DataTableTruncatedCellProps) {
  const title = getTooltipText(value);

  return (
    <div
      title={title}
      className={cn(
        "min-w-0 max-w-full truncate whitespace-nowrap",
        truncateDescendantClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

DataTableTruncatedCell.displayName = "DataTableTruncatedCell";
