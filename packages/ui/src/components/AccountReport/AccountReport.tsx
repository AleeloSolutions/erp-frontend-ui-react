import { useMemo } from "react";
import { cn } from "../../utils/cn";
import { AccountReportBody } from "./AccountReportBody";
import { AccountReportHeader } from "./AccountReportHeader";
import type { AccountReportProps } from "./accountReport.types";
import { flattenAccountReportNodes, rowSpacingStyle } from "./accountReport.utils";
import { useExpandedIds } from "./useExpandedIds";

export function AccountReport({
  columns,
  nodes,
  title,
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

  const flatRows = useMemo(
    () =>
      flattenAccountReportNodes(nodes, expandedIds, {
        spacerBetweenSections,
        spacerAfterSubGroups,
      }),
    [nodes, expandedIds, spacerBetweenSections, spacerAfterSubGroups]
  );

  const toggleExpanded = (rowId: string) => {
    const nextExpandedIds = new Set(expandedIds);
    if (nextExpandedIds.has(rowId)) {
      nextExpandedIds.delete(rowId);
    } else {
      nextExpandedIds.add(rowId);
    }
    setExpandedIds(nextExpandedIds);
  };

  return (
    <div
      className={cn(
        "erp-account-report mx-auto w-full overflow-x-auto bg-white min-w-[768px] max-w-3xl",
        density === "compact" && "erp-account-report--compact",
        className
      )}
      style={rowSpacingStyle(rowSpacing)}
    >
      <div className="flex items-start p-6">
        <table className="mx-auto w-full border-spacing-0">
          <AccountReportHeader columns={columns} title={title} />
          <AccountReportBody
            rows={flatRows}
            columns={columns}
            locale={locale}
            onToggleExpanded={toggleExpanded}
            onAmountClick={onAmountClick}
            onLabelClick={onLabelClick}
            onRowAction={onRowAction}
          />
        </table>
      </div>
    </div>
  );
}
