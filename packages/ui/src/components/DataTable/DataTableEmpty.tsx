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
      <td colSpan={colSpan} className="!bg-white !p-0">
        <div className="grid min-h-[120px] place-items-center text-[11px] text-[#7A869A]">
          {message}
        </div>
      </td>
    </tr>
  );
}
