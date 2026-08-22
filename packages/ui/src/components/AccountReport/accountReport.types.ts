import type { ReactNode } from "react";
import type {
  AccountReportColumn,
  AccountReportFlatRow,
  AccountReportNode,
} from "../../types/report";

/** The `kind: "line"` variant — the only flat row that renders label/amount content. */
export type AccountReportLineRow = Extract<AccountReportFlatRow, { kind: "line" }>;

export type AccountReportRowSpacing = {
  /** Vertical padding inside data rows (`--report-row-py`). */
  rowPy?: string;
  /** Gap between major sections (`--report-section-spacer-height`). */
  sectionSpacer?: string;
  /** Gap after subsection groups (`--report-subgroup-spacer-height`). */
  subGroupSpacer?: string;
  /** Fold caret gutter (`--report-fold-size`). */
  foldSize?: string;
  /** Text line height (`--report-line-height`). */
  lineHeight?: string;
};

export type AccountReportDensity = "default" | "compact";

export type AccountReportProps = {
  columns: AccountReportColumn[];
  nodes: AccountReportNode[];
  /** Statement title rendered in the leading header cell (e.g. "BALANCE SHEET"). */
  title?: ReactNode;
  /** Controlled expanded row ids (Odoo `unfolded`). */
  expandedIds?: Set<string>;
  defaultExpandedIds?: Iterable<string>;
  onExpandedChange?: (expandedIds: Set<string>) => void;
  /** Insert blank spacer rows before each level-0 section (Odoo `tr.empty`). */
  spacerBetweenSections?: boolean;
  /** Insert blank spacer rows after each subsection group (Odoo `tr.empty`). Default true. */
  spacerAfterSubGroups?: boolean;
  /** Row vertical density. Override spacing via `--report-row-py` / `--report-fold-size` on the root. */
  density?: AccountReportDensity;
  /** Override row / spacer sizing via CSS variables on the report root. */
  rowSpacing?: AccountReportRowSpacing;
  locale?: string;
  className?: string;
  onAmountClick?: (rowId: string, columnKey: string) => void;
  onLabelClick?: (rowId: string) => void;
  onRowAction?: (rowId: string) => void;
};

/** Row-level callbacks shared by the body, rows and cells. */
export type AccountReportRowHandlers = Pick<
  AccountReportProps,
  "onAmountClick" | "onLabelClick" | "onRowAction"
>;
