import type { ReactNode } from "react";
import type { AccountReportColumn } from "../../types/report";
import { cn } from "../../utils/cn";

type AccountReportHeaderProps = {
  columns: AccountReportColumn[];
  /** Statement title shown in the leading header cell (e.g. "BALANCE SHEET"). */
  title?: ReactNode;
};

/** Sticky column header row. The leading cell spans the label column. */
export function AccountReportHeader({ columns, title }: AccountReportHeaderProps) {
  return (
    <thead id="table_header" className="sticky top-0 z-10 bg-white">
      <tr data-id="column_subheaders_row" className="border-0">
        <th className={cn("border-0 bg-white", title && "report-title")}>{title}</th>
        {columns.map((column) => (
          <th
            key={column.key}
            data-expression_label={column.key}
            className="numeric-header text-end text-nowrap tabular-nums"
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
