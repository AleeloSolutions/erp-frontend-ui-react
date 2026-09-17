import { type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../utils";
import { dataTableGroupIndent } from "./serverGrouping";

export interface DataTableGroupRowDisclosure {
  expanded: boolean;
  onToggle: () => void;
  /** Accessible name for the control (already translated). */
  label: string;
}

export interface DataTableGroupRowProps {
  colSpan: number;
  /** Small pill before the label — the grain or the grouped dimension. */
  badge?: ReactNode;
  label: ReactNode;
  /** Right-hand meta before the count, typically a money total. */
  summary?: ReactNode;
  /** Records in this group. Omitted renders no count. */
  count?: number;
  /** Nesting level for indentation. 0 is the outermost level. */
  depth?: number;
  /**
   * Renders the disclosure triangle and makes the whole row toggle. Passed only
   * where opening actually does something — client-side groups are always open,
   * so they get no triangle rather than a decorative one.
   */
  disclosure?: DataTableGroupRowDisclosure;
  className?: string;
}

/**
 * The one group header row used by both grouping modes — client-side
 * (TanStack, always expanded) and server-side (collapsible). Keeping a single
 * implementation is what stops the two modes looking like different products.
 */
export function DataTableGroupRow({
  colSpan,
  badge,
  label,
  summary,
  count,
  depth = 0,
  disclosure,
  className,
}: DataTableGroupRowProps) {
  const pad = dataTableGroupIndent(depth);
  const hasSummary = summary != null && summary !== false;

  const content = (
    <>
      {disclosure ? (
        disclosure.expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-erp-muted" aria-hidden />
        ) : (
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-erp-muted rtl:-scale-x-100"
            aria-hidden
          />
        )
      ) : null}
      {badge != null && badge !== false ? (
        <span className="inline-flex items-center rounded-full bg-erp-info-bg px-[0.65em] py-[0.25em] text-[0.75em] font-medium text-erp-info">
          {badge}
        </span>
      ) : null}
      <span className="min-w-0 truncate text-[14px] font-medium text-erp-text">
        {label}
      </span>
      <span className="ms-auto flex shrink-0 items-center gap-3 text-[14px] text-erp-muted">
        {hasSummary ? (
          <span className="tabular-nums font-medium text-erp-text">{summary}</span>
        ) : null}
        {count != null ? (
          <span className="tabular-nums">
            {count} item{count === 1 ? "" : "s"}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <tr className={cn("table-group-row", className)}>
      <td
        colSpan={colSpan}
        className="!border-b !border-erp-table-border !bg-erp-table-header !p-0"
      >
        {disclosure ? (
          <button
            type="button"
            onClick={disclosure.onToggle}
            aria-expanded={disclosure.expanded}
            aria-label={disclosure.label}
            className="flex h-10 w-full items-center gap-2 px-4 text-start hover:bg-erp-surface-hover"
            style={{ paddingInlineStart: 16 + pad }}
          >
            {content}
          </button>
        ) : (
          <div
            className="flex h-10 items-center gap-2 px-4"
            style={{ paddingInlineStart: 16 + pad }}
          >
            {content}
          </div>
        )}
      </td>
    </tr>
  );
}
