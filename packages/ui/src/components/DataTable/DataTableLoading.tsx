import { cn } from "../../utils";

export function DataTableLoading({
  rows = 6,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)} aria-busy="true" aria-live="polite">
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th
                key={index}
                className="h-10 border-b border-erp-table-border bg-erp-table-header px-4"
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
