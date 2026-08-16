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
    <div className={cn("overflow-auto", className)} aria-busy="true" aria-live="polite">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th
                key={index}
                className="h-8 border-b border-erp-border-strong bg-erp-surface-tint px-2"
              >
                <div className="h-2.5 w-16 animate-pulse rounded bg-erp-border" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td
                  key={colIndex}
                  className="h-[34px] border-b border-erp-border-soft px-2"
                >
                  <div className="h-2.5 w-full max-w-[140px] animate-pulse rounded bg-erp-border-soft" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
