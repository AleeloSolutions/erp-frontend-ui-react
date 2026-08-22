import { useState } from "react";
import type { AccountReportProps } from "./accountReport.types";

/**
 * Expanded-row state that is controlled when `expandedIdsProp` is supplied and
 * uncontrolled otherwise. `onExpandedChange` fires in both modes.
 */
export function useExpandedIds(
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
