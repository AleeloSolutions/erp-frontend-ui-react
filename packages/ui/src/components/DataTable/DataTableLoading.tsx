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
                className="h-8 border-b border-[#D9E2EC] bg-[#F8FAFC] px-2"
              >
                <div className="h-2.5 w-16 animate-pulse rounded bg-[#E4EAF1]" />
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
                  className="h-[34px] border-b border-[#EEF2F6] px-2"
                >
                  <div className="h-2.5 w-full max-w-[140px] animate-pulse rounded bg-[#EEF2F6]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
