import { cn } from "../../utils";

export function DataTableLoading({
  rows = 6,
  columns = 5,
  stickyTop = 0,
  className,
}: {
  rows?: number;
  columns?: number;
  /** Sticky `top` offset (px) — matches the loaded table's header, since this replaces it in place while loading. */
  stickyTop?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)} aria-busy="true" aria-live="polite">
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th
                key={index}
                style={{ top: stickyTop }}
                className="sticky z-10 h-10 border-b border-erp-table-border bg-erp-table-header px-4"
              >
                <div className="h-2.5 w-16 animate-pulse rounded bg-erp-table-border" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="h-10 border-b border-erp-table-border px-4">
                  <div className="h-2.5 w-full max-w-[140px] animate-pulse rounded bg-erp-table-border" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
