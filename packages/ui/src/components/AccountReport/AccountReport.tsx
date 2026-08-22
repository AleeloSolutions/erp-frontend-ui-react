import { useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import type {
  AccountReportColumn,
  AccountReportFlatRow,
  AccountReportNode,
} from "../../types/report";
import { cn } from "../../utils/cn";
import { formatReportAmount } from "../../utils/format";

/** Odoo `line_level_*` label indentation (after the fold gutter). */
const levelPaddingClass = (level: 0 | 1 | 3 | 5, detail?: boolean) =>
  cn({ 0: "ps-0", 1: "ps-1", 3: "ps-5", 5: "ps-9" }[level], detail && "ps-14");

const FOLD_GUTTER_CLASS = "inline-flex shrink-0 items-center justify-center";

/** Same CSS triangle as `Dropdown` caret — teal when open, subtle when closed. */
function AccountReportFoldCaret({ expanded }: { expanded: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-0 border-x-[4px] border-x-transparent border-t-[5px] border-solid transition-[transform,border-color] duration-150",
        expanded ? "border-t-erp-primary" : "-rotate-90 border-t-erp-subtle"
      )}
    />
  );
}

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
    if (options?.spacerBetweenSections && index > 0 && node.level === 0) {
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

export type AccountReportProps = {
  columns: AccountReportColumn[];
  nodes: AccountReportNode[];
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

function useExpandedIds(
  expandedIdsProp: Set<string> | undefined,
  defaultExpandedIds: Iterable<string> | undefined,
  onExpandedChange: AccountReportProps["onExpandedChange"]
) {
  const [internalExpandedIds, setInternalExpandedIds] = useState(
    () => new Set(defaultExpandedIds ?? [])
  );
  const expandedIds = expandedIdsProp ?? internalExpandedIds;

  const setExpandedIds = (next: Set<string>) => {
    if (expandedIdsProp === undefined) {
      setInternalExpandedIds(next);
    }
    onExpandedChange?.(next);
  };

  return [expandedIds, setExpandedIds] as const;
}

function rowHasAmounts(row: Extract<AccountReportFlatRow, { kind: "line" }>) {
  if (!row.amounts) return false;
  return Object.values(row.amounts).some(
    (value) => value !== undefined && value !== null
  );
}

function isAmountMuted(
  row: Extract<AccountReportFlatRow, { kind: "line" }>,
  value: number | null | undefined
) {
  if (row.muted !== undefined) return row.muted;
  return value === 0 || value === null;
}

function isSectionHeader(row: Extract<AccountReportFlatRow, { kind: "line" }>) {
  return (
    row.sectionHeader === true || (row.level === 0 && !row.total && !rowHasAmounts(row))
  );
}

function isSectionHeaderWithAmount(row: Extract<AccountReportFlatRow, { kind: "line" }>) {
  return isSectionHeader(row) && rowHasAmounts(row);
}

function labelClassName(row: Extract<AccountReportFlatRow, { kind: "line" }>) {
  const sectionHeader = isSectionHeader(row);
  const subsection = row.level === 3 && !row.total;

  return cn(
    "name text-erp-report-text",
    sectionHeader && "font-bold uppercase",
    (subsection || row.total || row.level === 1) && "font-bold",
    row.unfoldable && !row.unfolded && "font-normal",
    row.unfoldable && row.unfolded && "font-bold",
    row.level === 5 && !row.total && !row.unfoldable && "font-normal"
  );
}

function amountClassName(
  row: Extract<AccountReportFlatRow, { kind: "line" }>,
  muted: boolean
) {
  const sectionHeaderWithAmount = isSectionHeaderWithAmount(row);

  return cn(
    "name transition-colors",
    sectionHeaderWithAmount &&
      "font-bold text-erp-report-section-header-amount group-hover:text-erp-primary",
    !sectionHeaderWithAmount &&
      muted &&
      "font-normal text-erp-report-zero group-hover:text-erp-primary",
    !sectionHeaderWithAmount &&
      !muted &&
      "text-erp-report-text group-hover:text-erp-primary",
    !sectionHeaderWithAmount && !muted && row.total && "font-bold",
    !sectionHeaderWithAmount && !muted && !row.total && "font-normal"
  );
}

export function AccountReport({
  columns,
  nodes,
  expandedIds: expandedIdsProp,
  defaultExpandedIds,
  onExpandedChange,
  spacerBetweenSections = false,
  spacerAfterSubGroups = false,
  density = "default",
  rowSpacing,
  locale = "en-US",
  className,
  onAmountClick,
  onLabelClick,
  onRowAction,
}: AccountReportProps) {
  const [expandedIds, setExpandedIds] = useExpandedIds(
    expandedIdsProp,
    defaultExpandedIds,
    onExpandedChange
  );

  const rows = useMemo(
    () =>
      flattenAccountReportNodes(nodes, expandedIds, {
        spacerBetweenSections,
        spacerAfterSubGroups,
      }),
    [nodes, expandedIds, spacerBetweenSections, spacerAfterSubGroups]
  );

  const toggleExpanded = (rowId: string) => {
    const next = new Set(expandedIds);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    setExpandedIds(next);
  };

  const rowSpacingStyle = rowSpacing
    ? ({
        ...(rowSpacing.rowPy && { "--report-row-py": rowSpacing.rowPy }),
        ...(rowSpacing.sectionSpacer && {
          "--report-section-spacer-height": rowSpacing.sectionSpacer,
        }),
        ...(rowSpacing.subGroupSpacer && {
          "--report-subgroup-spacer-height": rowSpacing.subGroupSpacer,
        }),
        ...(rowSpacing.foldSize && { "--report-fold-size": rowSpacing.foldSize }),
        ...(rowSpacing.lineHeight && {
          "--report-line-height": rowSpacing.lineHeight,
        }),
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={cn(
        "erp-account-report mx-auto w-full overflow-x-auto bg-white min-w-[768px] max-w-3xl",
        density === "compact" && "erp-account-report--compact",
        className
      )}
      style={rowSpacingStyle}
    >
      <div className="flex items-start p-6">
        <table className="mx-auto w-full border-spacing-0">
          <thead id="table_header" className="sticky top-0 z-10 bg-white">
            <tr data-id="column_subheaders_row" className="border-0">
              <th className="border-0 bg-white" />
              {columns.map((column) => (
                <th
                  key={column.key}
                  colSpan={1}
                  data-expression_label={column.key}
                  className="numeric-header text-end text-nowrap tabular-nums"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.kind === "empty") {
                return (
                  <tr
                    key={row.id}
                    className={cn("empty", row.spacer === "section" && "empty--section")}
                    aria-hidden="true"
                  >
                    <td colSpan={columns.length + 1} />
                  </tr>
                );
              }

              const sectionHeader = isSectionHeader(row);

              return (
                <tr
                  key={row.id}
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
                  <td
                    data-id="line_name"
                    className={cn(
                      "line_name border-x-0 border-t-0 align-middle",
                      levelPaddingClass(row.level, row.detail),
                      row.unfoldable && "unfoldable"
                    )}
                  >
                    <div className="wrapper flex items-center gap-0">
                      {row.unfoldable ? (
                        <button
                          type="button"
                          data-id="btn_foldable"
                          className={cn(
                            FOLD_GUTTER_CLASS,
                            "btn_foldable border-0 bg-transparent p-0 hover:opacity-80"
                          )}
                          aria-expanded={row.unfolded}
                          aria-label={row.unfolded ? "Collapse" : "Expand"}
                          onClick={() => toggleExpanded(row.id)}
                        >
                          <AccountReportFoldCaret expanded={Boolean(row.unfolded)} />
                        </button>
                      ) : (
                        <span
                          className={cn(FOLD_GUTTER_CLASS, "btn_foldable_empty")}
                          aria-hidden="true"
                        />
                      )}

                      {row.labelLink ? (
                        <button
                          type="button"
                          className="clickable cursor-pointer border-0 bg-transparent p-0 text-start font-normal text-erp-report-text hover:underline"
                          onClick={() => onLabelClick?.(row.id)}
                        >
                          {row.label}
                        </button>
                      ) : (
                        <div
                          data-id="content"
                          className="content flex min-w-0 items-center gap-0.5"
                        >
                          <div className={labelClassName(row)}>{row.label}</div>
                          {row.showActions && onRowAction ? (
                            <button
                              type="button"
                              className="inline-flex shrink-0 border-0 bg-transparent p-0 text-erp-subtle hover:text-erp-report-text"
                              aria-label="Row actions"
                              onClick={() => onRowAction(row.id)}
                            >
                              <MoreVertical className="size-3.5" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </td>

                  {columns.map((column) => {
                    const rawAmount = row.amounts?.[column.key];
                    const hasAmount = rawAmount !== undefined && rawAmount !== null;
                    const muted = hasAmount && isAmountMuted(row, rawAmount);

                    return (
                      <td
                        key={column.key}
                        data-id="line_cell"
                        data-expression_label={column.key}
                        className={cn(
                          "line_cell auditable numeric border-x-0 border-t-0 text-end align-middle tabular-nums",
                          muted && "muted"
                        )}
                      >
                        {/* for amount money */}
                        <div className="wrapper flex items-center justify-end">
                          {hasAmount ? (
                            <div className="content">
                              {onAmountClick ? (
                                <button
                                  type="button"
                                  className={cn(
                                    "cursor-pointer border-0 bg-transparent p-0 hover:underline",
                                    amountClassName(row, muted)
                                  )}
                                  onClick={() => onAmountClick(row.id, column.key)}
                                >
                                  {formatReportAmount(rawAmount, locale)}
                                </button>
                              ) : (
                                <div className={amountClassName(row, muted)}>
                                  {formatReportAmount(rawAmount, locale)}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
