import type { CSSProperties } from "react";
import type { Column } from "@tanstack/react-table";
import "../../types/table";

/** Width rules for `<col>` — owns layout under `table-layout: fixed`. */
export function getColumnWidthStyle<TData, TValue>(
  column: Column<TData, TValue>
): CSSProperties {
  if (column.columnDef.meta?.fill) {
    return { width: "100%" };
  }
  return { width: column.getSize() };
}

/**
 * Cell/header styles — minWidth only so per-row content cannot fight colgroup widths
 * (which caused the select checkboxes to zig-zag).
 */
export function getColumnCellStyle<TData, TValue>(
  column: Column<TData, TValue>
): CSSProperties {
  return { minWidth: column.getSize() };
}
