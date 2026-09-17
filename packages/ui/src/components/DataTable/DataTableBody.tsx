import { Fragment, type ReactNode } from "react";
import type { Row, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { cn, formatPeriodBucket, parsePeriodGroupingColumnId } from "../../utils";
import { useUiTranslation } from "../../i18n";
import { DataTableEmpty } from "./DataTableEmpty";
import { DataTableGroupRow } from "./DataTableGroupRow";
import { DataTableGroupLoadMoreRow } from "./DataTableGroupLoadMoreRow";
import { DataTableCurrencyTotals } from "./DataTableCurrencyTotals";
import { DataTableTruncatedCell } from "./DataTableTruncatedCell";
import { getColumnCellStyle } from "./column-width";
import {
  dataTableGroupIndent,
  dataTableGroupStateInset,
  type DataTableServerGroupSection,
} from "./serverGrouping";
import "../../types/table";

function groupingBadgeLabel(columnId: string): string {
  const period = parsePeriodGroupingColumnId(columnId);
  if (!period) return columnId;
  return period.grain.charAt(0).toUpperCase() + period.grain.slice(1);
}

function groupingValueLabel(columnId: string, raw: string): string {
  const period = parsePeriodGroupingColumnId(columnId);
  if (!period) return raw;
  return formatPeriodBucket(raw, period.grain);
}

export interface DataTableGroupSummaryContext<TData> {
  /** Leaf rows in this group (includes nested children when deeper grains exist). */
  rows: TData[];
  columnId: string;
  groupValue: string;
  depth: number;
}

/**
 * Everything the body needs to draw server-computed groups. `DataTable` owns
 * the expansion state and the flattening, so the sections and the row model it
 * hands over are always in step.
 *
 * `sections` is a tree: a section holds either rows (via `rowStart`/`rowCount`
 * into the flat row model) or `children` sections, never both. Only expanded
 * nodes have children, so a collapsed parent cannot render stale descendants.
 */
export interface DataTableServerGroupsConfig<TData> {
  sections: DataTableServerGroupSection<TData>[];
  /** Pill naming the grouped dimension, e.g. "Customer". Level 0 only. */
  groupLabel?: ReactNode;
  /** Pill for a group row at `depth` — nested groupings name every level. */
  levelLabel?: (depth: number) => ReactNode;
  formatAmount?: (amount: string, currency: string) => ReactNode;
  /** Opens or closes the node at `pathId`. */
  onToggle: (pathId: string) => void;
  /** Absent means a failed node shows no retry control. */
  onRetry?: (path: string[]) => void;
  /**
   * Absent means a partially loaded group shows its "showing N of M" count
   * with no control to service it.
   */
  onLoadMore?: (path: string[]) => void;
  /** Rows the next load-more request asks for, for the button label. */
  loadMorePageSize?: number;
}

export interface DataTableBodyProps<TData> {
  table: Table<TData>;
  emptyMessage?: string;
  /** One or more column ids — nested group headers in order. */
  groupingColumnIds?: string[];
  /** Last unchecked row — persistent hover-style row background. */
  activeRowId?: string | null;
  /** Clear last-unchecked emphasis when another row is clicked. */
  onClearActiveRow?: () => void;
  /** Optional per-row `<tr>` classes (e.g. `[&>td]:text-erp-brand-third`). */
  getRowClassName?: (row: TData) => string | undefined;
  /**
   * Extra meta on the right of each group header (beside the item count),
   * e.g. a money total for the portion. Shared by every Group By consumer.
   */
  renderGroupSummary?: (ctx: DataTableGroupSummaryContext<TData>) => ReactNode;
  /**
   * Server-grouped mode. When set, the body renders collapsible group rows
   * instead of the client-side grouping model, and `groupingColumnIds` is
   * ignored.
   */
  serverGroups?: DataTableServerGroupsConfig<TData>;
}

function DataRow<TData>({
  row,
  activeRowId,
  onClearActiveRow,
  getRowClassName,
  indent = 0,
}: {
  row: Row<TData>;
  activeRowId?: string | null;
  onClearActiveRow?: () => void;
  getRowClassName?: (row: TData) => string | undefined;
  /**
   * Inline-start offset, in px, for rows sitting inside a nested group. Zero
   * at the top level, so flat and single-level tables are untouched.
   */
  indent?: number;
}) {
  const isSelected = row.getIsSelected();
  const isActive = !isSelected && activeRowId != null && row.id === activeRowId;
  const rowClassName = getRowClassName?.(row.original);
  const cells = row.getVisibleCells();
  // Indent the first *content* cell: the checkbox column is a fixed-width,
  // centred control and padding it would push the box out of its column.
  const indentIndex = Math.max(
    cells.findIndex((cell) => cell.column.id !== "__select"),
    0
  );

  return (
    <tr
      onClick={() => {
        if (activeRowId != null && row.id !== activeRowId) {
          onClearActiveRow?.();
        }
      }}
      className={cn(
        "odd:[&>td]:bg-erp-table-odd even:[&>td]:bg-erp-table-even",
        "odd:hover:[&>td]:bg-erp-table-odd-hover even:hover:[&>td]:bg-erp-table-even-hover",
        isActive && "[&>td]:!bg-erp-table-checked-active",
        isSelected && "[&>td]:!bg-erp-brand-third-overlay",
        rowClassName
      )}
    >
      {cells.map((cell, index) => {
        const alignRight = cell.column.columnDef.meta?.align === "right";
        const isSelect = cell.column.id === "__select";
        const isActions = cell.column.id === "__actions";
        const skipTruncate = isSelect || isActions;
        const cellIndent = indent > 0 && index === indentIndex ? indent : 0;
        const cellStyle = getColumnCellStyle(cell.column);
        // Added to the column's own padding, not substituted for it — replacing
        // it would leave depth 1 flush with depth 0 and cost the row its gutter.
        const basePad =
          typeof cellStyle.paddingInlineStart === "number"
            ? cellStyle.paddingInlineStart
            : 0;

        return (
          <td
            key={cell.id}
            style={
              cellIndent > 0
                ? { ...cellStyle, paddingInlineStart: basePad + cellIndent }
                : cellStyle
            }
            className={cn(
              "h-10 overflow-hidden border-b border-erp-table-border text-[14px] text-erp-text align-middle whitespace-nowrap",
              isSelect || isActions ? "p-0" : "py-1",
              isSelect && "overflow-visible text-center",
              alignRight && "text-end tabular-nums"
            )}
          >
            {skipTruncate ? (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            ) : (
              <DataTableTruncatedCell value={cell.getValue()}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </DataTableTruncatedCell>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function GroupedRows<TData>({
  rows,
  columnIds,
  colSpan,
  depth = 0,
  activeRowId,
  onClearActiveRow,
  getRowClassName,
  renderGroupSummary,
}: {
  rows: Row<TData>[];
  columnIds: string[];
  colSpan: number;
  depth?: number;
  activeRowId?: string | null;
  onClearActiveRow?: () => void;
  getRowClassName?: (row: TData) => string | undefined;
  renderGroupSummary?: (ctx: DataTableGroupSummaryContext<TData>) => ReactNode;
}) {
  if (columnIds.length === 0) {
    return (
      <>
        {rows.map((row) => (
          <DataRow
            key={row.id}
            row={row}
            activeRowId={activeRowId}
            onClearActiveRow={onClearActiveRow}
            getRowClassName={getRowClassName}
          />
        ))}
      </>
    );
  }

  const [columnId, ...rest] = columnIds;
  const groups = new Map<string, Row<TData>[]>();
  rows.forEach((row) => {
    const raw = row.getValue(columnId);
    const key = String(raw ?? "Unspecified");
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  });

  return (
    <>
      {[...groups.entries()].map(([groupName, groupRows]) => {
        const summary = renderGroupSummary?.({
          rows: groupRows.map((row) => row.original),
          columnId,
          groupValue: groupName,
          depth,
        });
        return (
          <Fragment key={`${columnId}:${groupName}:${depth}`}>
            <DataTableGroupRow
              colSpan={colSpan}
              depth={depth}
              badge={groupingBadgeLabel(columnId)}
              label={groupingValueLabel(columnId, groupName)}
              summary={summary}
              count={groupRows.length}
            />
            <GroupedRows
              rows={groupRows}
              columnIds={rest}
              colSpan={colSpan}
              depth={depth + 1}
              activeRowId={activeRowId}
              onClearActiveRow={onClearActiveRow}
              getRowClassName={getRowClassName}
              renderGroupSummary={renderGroupSummary}
            />
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * In-group status line — loading, failed, or loaded-but-empty.
 *
 * Deliberately rendered *inside* the group it belongs to: one slow or broken
 * group must not blank out the groups around it. `depth` is the depth of the
 * owning group, so the line sits under its header at any level.
 */
function GroupStateRow({
  colSpan,
  depth,
  variant,
  message,
  onRetry,
}: {
  colSpan: number;
  depth: number;
  variant: "loading" | "error" | "empty";
  message?: ReactNode;
  onRetry?: () => void;
}) {
  const { t } = useUiTranslation("ui");

  return (
    <tr className={`table-group-state-row table-group-state-row--${variant}`}>
      <td
        colSpan={colSpan}
        className={cn(
          "!border-b !border-erp-table-border !p-0",
          variant === "error" ? "!bg-erp-error-bg" : "!bg-erp-table-bg"
        )}
      >
        <div
          className="flex h-10 items-center gap-2 pe-4"
          style={{ paddingInlineStart: dataTableGroupStateInset(depth) }}
          role={variant === "error" ? "alert" : "status"}
          aria-live={variant === "loading" ? "polite" : undefined}
          aria-busy={variant === "loading" || undefined}
        >
          {variant === "loading" ? (
            <>
              <span
                className="h-2.5 w-28 animate-pulse rounded bg-erp-table-border"
                aria-hidden
              />
              <span className="text-[13px] text-erp-muted">
                {message ?? t("datatable.groupRowsLoading")}
              </span>
            </>
          ) : null}
          {variant === "error" ? (
            <>
              <AlertTriangle className="h-4 w-4 shrink-0 text-erp-error" aria-hidden />
              <span className="min-w-0 truncate text-[13px] text-erp-error">
                {message || t("datatable.groupRowsError")}
              </span>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="ms-auto shrink-0 rounded border border-erp-error-border px-2 py-0.5 text-[13px] font-medium text-erp-error hover:bg-erp-error-border/30"
                >
                  {t("datatable.retry")}
                </button>
              ) : null}
            </>
          ) : null}
          {variant === "empty" ? (
            <span className="text-[13px] text-erp-muted">
              {message ?? t("datatable.groupRowsEmpty")}
            </span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

/**
 * One server group and whatever it currently holds — sub-groups, rows, or a
 * status line. Recursive, so depth is limited only by what the server hands
 * over.
 */
function ServerGroupSection<TData>({
  section,
  rows,
  colSpan,
  config,
  activeRowId,
  onClearActiveRow,
  getRowClassName,
}: {
  section: DataTableServerGroupSection<TData>;
  rows: Row<TData>[];
  colSpan: number;
  config: DataTableServerGroupsConfig<TData>;
  activeRowId?: string | null;
  onClearActiveRow?: () => void;
  getRowClassName?: (row: TData) => string | undefined;
}) {
  const { t } = useUiTranslation("ui");
  const { group, path, pathId, depth, expanded, contains } = section;

  const holdsGroups = contains === "groups";
  const loadedCount = holdsGroups ? section.children.length : section.rowCount;
  const showLoading = expanded && section.loading;
  const showError = expanded && !showLoading && Boolean(section.error);
  const showEmpty = expanded && !showLoading && !showError && loadedCount === 0;
  const badge = config.levelLabel
    ? config.levelLabel(depth)
    : depth === 0
      ? config.groupLabel
      : undefined;

  return (
    <>
      <DataTableGroupRow
        colSpan={colSpan}
        depth={depth}
        badge={badge}
        label={group.label}
        count={group.count}
        summary={
          // Omit rather than render an empty slot: a group with no totals
          // should not leave a gap where the money goes.
          Object.keys(group.totals).length > 0 ? (
            <DataTableCurrencyTotals
              totals={group.totals}
              formatAmount={config.formatAmount}
            />
          ) : undefined
        }
        disclosure={{
          expanded,
          onToggle: () => config.onToggle(pathId),
          label: expanded
            ? t("datatable.collapseGroup", { label: group.label })
            : t("datatable.expandGroup", { label: group.label }),
        }}
      />
      {showLoading ? (
        <GroupStateRow
          colSpan={colSpan}
          depth={depth}
          variant="loading"
          message={holdsGroups ? t("datatable.groupChildrenLoading") : undefined}
        />
      ) : null}
      {showError ? (
        <GroupStateRow
          colSpan={colSpan}
          depth={depth}
          variant="error"
          message={
            section.error ||
            (holdsGroups
              ? t("datatable.groupChildrenError")
              : t("datatable.groupRowsError"))
          }
          onRetry={config.onRetry ? () => config.onRetry?.(path) : undefined}
        />
      ) : null}
      {showEmpty ? (
        <GroupStateRow
          colSpan={colSpan}
          depth={depth}
          variant="empty"
          message={holdsGroups ? t("datatable.groupChildrenEmpty") : undefined}
        />
      ) : null}
      {holdsGroups
        ? section.children.map((child) => (
            <ServerGroupSection
              key={child.pathId}
              section={child}
              rows={rows}
              colSpan={colSpan}
              config={config}
              activeRowId={activeRowId}
              onClearActiveRow={onClearActiveRow}
              getRowClassName={getRowClassName}
            />
          ))
        : rows
            .slice(section.rowStart, section.rowStart + section.rowCount)
            .map((row) => (
              <DataRow
                key={row.id}
                row={row}
                activeRowId={activeRowId}
                onClearActiveRow={onClearActiveRow}
                getRowClassName={getRowClassName}
                indent={dataTableGroupIndent(depth)}
              />
            ))}
      {!holdsGroups && expanded && section.rowCount > 0 ? (
        <DataTableGroupLoadMoreRow
          colSpan={colSpan}
          depth={depth}
          loaded={section.rowCount}
          total={section.rowTotal}
          pageSize={config.loadMorePageSize}
          loading={section.loadingMore}
          onLoadMore={config.onLoadMore ? () => config.onLoadMore?.(path) : undefined}
        />
      ) : null}
    </>
  );
}

export function DataTableBody<TData>({
  table,
  emptyMessage,
  groupingColumnIds = [],
  activeRowId = null,
  onClearActiveRow,
  getRowClassName,
  renderGroupSummary,
  serverGroups,
}: DataTableBodyProps<TData>) {
  const rows = table.getRowModel().rows;
  const colSpan = Math.max(table.getVisibleLeafColumns().length, 1);

  if (serverGroups) {
    if (serverGroups.sections.length === 0) {
      return (
        <tbody>
          <DataTableEmpty colSpan={colSpan} message={emptyMessage} />
        </tbody>
      );
    }
    return (
      <tbody>
        {serverGroups.sections.map((section) => (
          <ServerGroupSection
            key={section.pathId}
            section={section}
            rows={rows}
            colSpan={colSpan}
            config={serverGroups}
            activeRowId={activeRowId}
            onClearActiveRow={onClearActiveRow}
            getRowClassName={getRowClassName}
          />
        ))}
      </tbody>
    );
  }

  if (rows.length === 0) {
    return (
      <tbody>
        <DataTableEmpty colSpan={colSpan} message={emptyMessage} />
      </tbody>
    );
  }

  if (groupingColumnIds.length > 0) {
    return (
      <tbody>
        <GroupedRows
          rows={rows}
          columnIds={groupingColumnIds}
          colSpan={colSpan}
          activeRowId={activeRowId}
          onClearActiveRow={onClearActiveRow}
          getRowClassName={getRowClassName}
          renderGroupSummary={renderGroupSummary}
        />
      </tbody>
    );
  }

  return (
    <tbody>
      {rows.map((row) => (
        <DataRow
          key={row.id}
          row={row}
          activeRowId={activeRowId}
          onClearActiveRow={onClearActiveRow}
          getRowClassName={getRowClassName}
        />
      ))}
    </tbody>
  );
}
