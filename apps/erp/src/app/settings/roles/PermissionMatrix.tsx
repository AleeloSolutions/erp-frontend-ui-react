/**
 * The permission grid: one row per resource, one column per action, a
 * tick per cell — the Rise-style role editor.
 *
 * Rows come from `/api/v1/permissions/matrix/`, grouped under their module
 * heading. A cell the resource does not offer (Reports has nothing to
 * create) renders as a dash. An own-scope cell whose full verb is ticked
 * shows ticked and locked: "edit" already includes "edit own".
 *
 * `readOnly` renders the same grid as a summary — the user form uses it to
 * show what the chosen role allows. `canConfer` greys out cells the viewer
 * cannot hand out (the API refuses them anyway; not offering them says so
 * up front).
 */

import { useMemo } from "react";
import { Checkbox, cn } from "@erp/ui";
import type { PermissionCell, PermissionMatrix, PermissionResource } from "../rolesApi";

export interface PermissionMatrixProps {
  matrix: PermissionMatrix | null;
  /** The codes ticked. */
  selected: ReadonlySet<string>;
  onChange?: (next: Set<string>) => void;
  readOnly?: boolean;
  /** Whether the viewer may hand out a code; unknown (loading) → true. */
  canConfer?: (code: string) => boolean;
  className?: string;
}

/** Resources in catalogue order, bucketed by their group heading. */
function byGroup(resources: PermissionResource[]): [string, PermissionResource[]][] {
  const groups = new Map<string, PermissionResource[]>();
  for (const resource of resources) {
    groups.set(resource.group, [...(groups.get(resource.group) ?? []), resource]);
  }
  return [...groups.entries()];
}

export function PermissionMatrixGrid({
  matrix,
  selected,
  onChange,
  readOnly = false,
  canConfer = () => true,
  className,
}: PermissionMatrixProps) {
  const groups = useMemo(() => byGroup(matrix?.resources ?? []), [matrix]);
  const editable = !readOnly && Boolean(onChange);

  if (!matrix) {
    return (
      <p className={cn("m-0 text-[12px] text-erp-muted", className)}>
        Sign in to a workspace to see the permissions.
      </p>
    );
  }

  /** Ticked outright, or carried along by its full verb. */
  function isOn(cell: PermissionCell): boolean {
    return (
      selected.has(cell.code) || Boolean(cell.implied_by && selected.has(cell.implied_by))
    );
  }

  /** Locked because its full verb is ticked. */
  function isImplied(cell: PermissionCell): boolean {
    return Boolean(cell.implied_by && selected.has(cell.implied_by));
  }

  function toggle(cell: PermissionCell, on: boolean) {
    if (!onChange) return;
    const next = new Set(selected);
    if (on) {
      next.add(cell.code);
      // A full verb brings its own-scope twin so the stored role reads
      // the way the grid does.
      for (const resource of matrix!.resources) {
        for (const other of resource.actions) {
          if (other.implied_by === cell.code) next.add(other.code);
        }
      }
    } else {
      next.delete(cell.code);
    }
    onChange(next);
  }

  function setRow(resource: PermissionResource, on: boolean) {
    if (!onChange) return;
    const next = new Set(selected);
    for (const cell of resource.actions) {
      if (on && canConfer(cell.code)) next.add(cell.code);
      if (!on) next.delete(cell.code);
    }
    onChange(next);
  }

  function rowState(resource: PermissionResource): "all" | "some" | "none" {
    const on = resource.actions.filter((cell) => isOn(cell)).length;
    if (on === 0) return "none";
    return on === resource.actions.length ? "all" : "some";
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-erp-border bg-erp-header text-[11px] uppercase tracking-[.06em] text-erp-muted">
            <th className="px-3 py-2 text-left font-bold">Module</th>
            {matrix.actions.map((action) => (
              <th key={action.key} className="px-2 py-2 text-center font-bold">
                {action.label}
              </th>
            ))}
            {editable ? <th className="px-2 py-2 text-center font-bold">All</th> : null}
          </tr>
        </thead>
        <tbody>
          {groups.map(([group, resources]) => (
            <GroupRows
              key={group}
              group={group}
              resources={resources}
              columns={matrix.actions.map((action) => action.key)}
              editable={editable}
              canConfer={canConfer}
              isOn={isOn}
              isImplied={isImplied}
              rowState={rowState}
              onToggle={toggle}
              onSetRow={setRow}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({
  group,
  resources,
  columns,
  editable,
  canConfer,
  isOn,
  isImplied,
  rowState,
  onToggle,
  onSetRow,
}: {
  group: string;
  resources: PermissionResource[];
  columns: string[];
  editable: boolean;
  canConfer: (code: string) => boolean;
  isOn: (cell: PermissionCell) => boolean;
  isImplied: (cell: PermissionCell) => boolean;
  rowState: (resource: PermissionResource) => "all" | "some" | "none";
  onToggle: (cell: PermissionCell, on: boolean) => void;
  onSetRow: (resource: PermissionResource, on: boolean) => void;
}) {
  const span = columns.length + 1 + (editable ? 1 : 0);
  return (
    <>
      <tr className="border-b border-erp-border-soft">
        <td
          colSpan={span}
          className="bg-white px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[.08em] text-erp-brand-third"
        >
          {group}
        </td>
      </tr>
      {resources.map((resource) => {
        const cells = new Map(resource.actions.map((cell) => [cell.key, cell]));
        const state = rowState(resource);
        return (
          <tr
            key={resource.key}
            className="border-b border-erp-border-soft hover:bg-erp-table-hover/40"
          >
            <td className="px-3 py-2 text-erp-text" title={resource.help}>
              {resource.label}
            </td>
            {columns.map((column) => {
              const cell = cells.get(column);
              if (!cell) {
                return (
                  <td key={column} className="px-2 py-2 text-center text-erp-muted/50">
                    —
                  </td>
                );
              }
              const on = isOn(cell);
              const implied = isImplied(cell);
              const locked = !editable || implied || (!on && !canConfer(cell.code));
              return (
                <td key={column} className="px-2 py-2 text-center">
                  <Checkbox
                    id={`perm-${cell.code}`}
                    aria-label={`${resource.label}: ${cell.label}`}
                    hasHalo={false}
                    checked={on}
                    disabled={locked}
                    title={
                      implied
                        ? `Included in "${cell.label.replace(" own", "")}"`
                        : !on && editable && !canConfer(cell.code)
                          ? "You cannot give access you do not hold yourself"
                          : cell.code
                    }
                    onChange={(event) => onToggle(cell, event.target.checked)}
                  />
                </td>
              );
            })}
            {editable ? (
              <td className="px-2 py-2 text-center">
                <Checkbox
                  id={`perm-all-${resource.key}`}
                  aria-label={`${resource.label}: everything`}
                  hasHalo={false}
                  checked={state === "all"}
                  indeterminate={state === "some"}
                  onChange={(event) => onSetRow(resource, event.target.checked)}
                />
              </td>
            ) : null}
          </tr>
        );
      })}
    </>
  );
}
