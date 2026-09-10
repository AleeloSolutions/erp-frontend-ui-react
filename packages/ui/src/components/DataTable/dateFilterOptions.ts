import type { DataTableFilterOption, DataTableGroupingOption } from "../../types/table";
import {
  PERIOD_GROUP_TREE,
  buildOdooDateFilterOptions,
  periodGroupingColumnId,
  type PeriodGrain,
} from "../../utils/datePresets";

/** Default Odoo Create Date tree: months, quarters, years (with year separator). */
export function defaultDatePresetOptions(
  now: Date = new Date()
): DataTableFilterOption[] {
  return buildOdooDateFilterOptions(now).map((option) => ({
    label: option.label,
    value: option.value,
    dividerBefore: option.dividerBefore,
  }));
}

/**
 * Group By parent with Year → Quarter → Month → Week → Day children.
 * Parent shows checked when any child grain is active; click clears children.
 */
export function periodGroupingOption(
  label: string,
  dateField: string,
  options?: { defaultExpanded?: boolean }
): DataTableGroupingOption {
  return {
    label,
    value: `__date_group:${dateField}`,
    selectable: true,
    defaultExpanded: options?.defaultExpanded ?? true,
    dateField,
    children: PERIOD_GROUP_TREE.map((grain) => ({
      label: grain.label,
      value: periodGroupingColumnId(grain.id, dateField),
    })),
  };
}

export function isPeriodGrain(value: string): value is PeriodGrain {
  return (
    value === "year" ||
    value === "quarter" ||
    value === "month" ||
    value === "week" ||
    value === "day"
  );
}
