/** Odoo account report line depth (matches `line_level_*` in Odoo HTML). */
export type AccountReportLevel = 0 | 1 | 3 | 5;

export type AccountReportColumn = {
  key: string;
  label: string;
};

export type AccountReportNode = {
  id: string;
  label: string;
  level: AccountReportLevel;
  /** Section total row (`tr.total`). */
  total?: boolean;
  /** Row can expand/collapse children (`unfoldable`). */
  unfoldable?: boolean;
  /** Label is a drill-down link (e.g. "Current Year Unallocated Earnings"). */
  labelLink?: boolean;
  /** Amounts per column key. Omit for group headers without figures. */
  amounts?: Record<string, number | null | undefined>;
  /** Force muted styling on amounts (Odoo `muted` class). Defaults true when amount is 0. */
  muted?: boolean;
  /** Account drill-down line (e.g. "121000 Accounts Receivable") — extra indent. */
  detail?: boolean;
  /** Row exposes an actions menu trigger when `onRowAction` is provided on the report. */
  showActions?: boolean;
  /** Level-0 bar header with optional amount (e.g. LIABILITIES + EQUITY). */
  sectionHeader?: boolean;
  /** Force a blank spacer row before this node. Ignored for the first node in its list. */
  spacerBefore?: boolean;
  children?: AccountReportNode[];
};

export type AccountReportEmptySpacer = "section" | "subgroup";

export type AccountReportFlatRow =
  | { kind: "empty"; id: string; spacer?: AccountReportEmptySpacer }
  | {
      kind: "line";
      id: string;
      label: string;
      level: AccountReportLevel;
      total?: boolean;
      unfoldable?: boolean;
      unfolded?: boolean;
      labelLink?: boolean;
      amounts?: Record<string, number | null | undefined>;
      muted?: boolean;
      detail?: boolean;
      showActions?: boolean;
      sectionHeader?: boolean;
    };
