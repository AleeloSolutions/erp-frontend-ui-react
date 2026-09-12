import { cn } from "../../utils";

export function DataTableEmpty({
  message = "No records match the current filters.",
  colSpan,
  className,
}: {
  message?: string;
  colSpan: number;
  className?: string;
}) {
  return (
    <tr className={cn("empty-row", className)}>
      <td colSpan={colSpan} className="!bg-erp-table-bg !p-0">
        {/* Tall enough that empty lists do not collapse under the fold and
            fight the page scrollbar (layout shake). */}
        <div className="grid min-h-[min(60vh,28rem)] place-items-center text-[0.875rem] text-erp-muted">
          {message}
        </div>
      </td>
    </tr>
  );
}
