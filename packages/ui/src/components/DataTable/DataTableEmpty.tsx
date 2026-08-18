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
        <div className="grid min-h-[120px] place-items-center text-[0.875rem] text-erp-muted">
          {message}
        </div>
      </td>
    </tr>
  );
}
