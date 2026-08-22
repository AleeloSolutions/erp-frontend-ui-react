import type { AccountReportColumn, AccountReportFlatRow } from "../../types/report";
import { cn } from "../../utils/cn";
import { AccountReportAmountCell, AccountReportLabelCell } from "./AccountReportCells";
import type {
  AccountReportLineRow,
  AccountReportRowHandlers,
} from "./accountReport.types";
import { isSectionHeader } from "./accountReport.utils";

type SpacerRow = Extract<AccountReportFlatRow, { kind: "empty" }>;

/** Blank Odoo `tr.empty` gap; height comes from the section/subgroup CSS variables. */
function AccountReportSpacerRow({ row, colSpan }: { row: SpacerRow; colSpan: number }) {
  return (
    <tr
      className={cn("empty", row.spacer === "section" && "empty--section")}
      aria-hidden="true"
    >
      <td colSpan={colSpan} />
    </tr>
  );
}

type RowProps = AccountReportRowHandlers & {
  row: AccountReportLineRow;
  columns: AccountReportColumn[];
  locale: string;
  onToggleExpanded: (rowId: string) => void;
};

function AccountReportRow({
  row,
  columns,
  locale,
  onToggleExpanded,
  ...handlers
}: RowProps) {
  const sectionHeader = isSectionHeader(row);

  return (
    <tr
      data-id="line"
      className={cn(
        "group transition-colors",
        `line_level_${row.level}`,
        row.unfolded && "unfolded",
        row.total && "total",
        "[&>td]:border-b [&>td]:border-erp-report-row-border",
        sectionHeader
          ? "[&>td]:bg-erp-report-section-header hover:[&>td]:bg-erp-report-section-header-hover"
          : "hover:[&>td]:bg-erp-report-row-hover"
      )}
    >
      <AccountReportLabelCell
        row={row}
        onToggleExpanded={onToggleExpanded}
        onLabelClick={handlers.onLabelClick}
        onRowAction={handlers.onRowAction}
      />
      {columns.map((column) => (
        <AccountReportAmountCell
          key={column.key}
          row={row}
          columnKey={column.key}
          locale={locale}
          onAmountClick={handlers.onAmountClick}
        />
      ))}
    </tr>
  );
}

type BodyProps = AccountReportRowHandlers & {
  rows: AccountReportFlatRow[];
  columns: AccountReportColumn[];
  locale: string;
  onToggleExpanded: (rowId: string) => void;
};

export function AccountReportBody({ rows, columns, ...rowProps }: BodyProps) {
  return (
    <tbody>
      {rows.map((row) =>
        row.kind === "empty" ? (
          <AccountReportSpacerRow key={row.id} row={row} colSpan={columns.length + 1} />
        ) : (
          <AccountReportRow key={row.id} row={row} columns={columns} {...rowProps} />
        )
      )}
    </tbody>
  );
}
