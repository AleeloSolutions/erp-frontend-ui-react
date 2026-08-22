import type { CSSProperties } from "react";
import type {
  AccountReportFlatRow,
  AccountReportLevel,
  AccountReportNode,
} from "../../types/report";
import { cn } from "../../utils/cn";
import type {
  AccountReportLineRow,
  AccountReportRowSpacing,
} from "./accountReport.types";

/** Amounts are optional per column; `null`/`undefined` means "no figure on this line". */
export function hasAmountValue(value: number | null | undefined): value is number {
  return value !== undefined && value !== null;
}

/** Odoo `line_level_*` label indentation (after the fold gutter). */
export const levelPaddingClass = (level: AccountReportLevel, detail?: boolean) =>
  cn({ 0: "ps-0", 1: "ps-1", 3: "ps-5", 5: "ps-9" }[level], detail && "ps-14");

export function flattenAccountReportNodes(
  nodes: AccountReportNode[],
  expandedIds: Set<string>,
  options?: {
    spacerBetweenSections?: boolean;
    /** Odoo `tr.empty` after each subsection group (e.g. after Total Current Liabilities). */
    spacerAfterSubGroups?: boolean;
  }
): AccountReportFlatRow[] {
  const rows: AccountReportFlatRow[] = [];
  const spacerAfterSubGroups = options?.spacerAfterSubGroups !== false;

  nodes.forEach((node, index) => {
    const startsNewSection = options?.spacerBetweenSections && node.level === 0;
    if (index > 0 && (node.spacerBefore || startsNewSection)) {
      rows.push({
        kind: "empty",
        id: `spacer-before-${node.id}`,
        spacer: "section",
      });
    }

    const expanded = !node.unfoldable || expandedIds.has(node.id);

    rows.push({
      kind: "line",
      id: node.id,
      label: node.label,
      level: node.level,
      total: node.total,
      unfoldable: node.unfoldable,
      unfolded: expanded,
      labelLink: node.labelLink,
      amounts: node.amounts,
      muted: node.muted,
      detail: node.detail,
      showActions: node.showActions,
      sectionHeader: node.sectionHeader,
    });

    if (node.children?.length && expanded) {
      rows.push(...flattenAccountReportNodes(node.children, expandedIds, options));

      // Sub-header group spacer — skip when the next row is a same-level sibling
      // (e.g. Total Current Assets → Fixed Assets). Odoo only gaps major sections.
      const nextSibling = nodes[index + 1];
      if (
        spacerAfterSubGroups &&
        !node.unfoldable &&
        node.level !== 0 &&
        index < nodes.length - 1 &&
        nextSibling.level !== node.level
      ) {
        rows.push({
          kind: "empty",
          id: `spacer-after-${node.id}`,
          spacer: "subgroup",
        });
      }
    }
  });

  return rows;
}

function rowHasAmounts(row: AccountReportLineRow) {
  if (!row.amounts) return false;
  return Object.values(row.amounts).some(hasAmountValue);
}

export function isAmountMuted(
  row: AccountReportLineRow,
  value: number | null | undefined
) {
  if (row.muted !== undefined) return row.muted;
  return value === 0 || value === null;
}

export function isSectionHeader(row: AccountReportLineRow) {
  return (
    row.sectionHeader === true || (row.level === 0 && !row.total && !rowHasAmounts(row))
  );
}

function isSectionHeaderWithAmount(row: AccountReportLineRow) {
  return isSectionHeader(row) && rowHasAmounts(row);
}

export function labelClassName(row: AccountReportLineRow) {
  const sectionHeader = isSectionHeader(row);
  const subsection = row.level === 3 && !row.total;

  // Ordered weakest → strongest: `cn` (twMerge) keeps the last font-weight that applies.
  return cn(
    "name text-erp-report-text",
    sectionHeader && "font-bold",
    (subsection || row.total || row.level === 1) && "font-bold",
    row.unfoldable && !row.unfolded && "font-normal",
    row.unfoldable && row.unfolded && "font-bold",
    row.level === 5 && !row.total && !row.unfoldable && "font-normal"
  );
}

const AMOUNT_BASE_CLASS = "name transition-colors";

export function amountClassName(row: AccountReportLineRow, muted: boolean) {
  if (isSectionHeaderWithAmount(row)) {
    return cn(
      AMOUNT_BASE_CLASS,
      "font-bold text-erp-report-section-header-amount group-hover:text-erp-primary"
    );
  }

  if (muted) {
    return cn(
      AMOUNT_BASE_CLASS,
      "font-normal text-erp-report-zero group-hover:text-erp-primary"
    );
  }

  return cn(
    AMOUNT_BASE_CLASS,
    "text-erp-report-text group-hover:text-erp-primary",
    row.total ? "font-bold" : "font-normal"
  );
}

const SPACING_CSS_VARS: Record<keyof AccountReportRowSpacing, string> = {
  rowPy: "--report-row-py",
  sectionSpacer: "--report-section-spacer-height",
  subGroupSpacer: "--report-subgroup-spacer-height",
  foldSize: "--report-fold-size",
  lineHeight: "--report-line-height",
};

/** Maps the `rowSpacing` prop onto the CSS custom properties the report stylesheet reads. */
export function rowSpacingStyle(
  rowSpacing: AccountReportRowSpacing | undefined
): CSSProperties | undefined {
  if (!rowSpacing) return undefined;

  const style: Record<string, string> = {};
  for (const key of Object.keys(SPACING_CSS_VARS) as (keyof AccountReportRowSpacing)[]) {
    const value = rowSpacing[key];
    if (value) style[SPACING_CSS_VARS[key]] = value;
  }
  return style as CSSProperties;
}
