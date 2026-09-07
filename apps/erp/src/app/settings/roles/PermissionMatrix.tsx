/**
 * The permission grid: one row per resource, one column per verb.
 *
 * Each cell is a rung of the scope ladder rather than a tick — all
 * branches, this branch, or own records — so a role reads the way an
 * administrator thinks: "invoices, edit, this branch". A verb the
 * resource does not offer renders as a dash, and a verb with a single
 * rung is a plain checkbox, since a dropdown of one is a worse control.
 *
 * Picking a rung stores that code and every narrower one, which is what
 * the backend stores too, so the grid and the saved role never disagree.
 *
 * `readOnly` renders the same grid as a summary; the user form uses it to
 * show what the chosen role allows. `canConfer` hides rungs the viewer
 * does not hold themselves, because the API refuses to confer those.
 */

import { useMemo } from "react";
import { Checkbox, FormDropdown, cn } from "@erp/ui";
import {
  NO_ACCESS,
  cellCodes,
  scopeOf,
  type PermissionCell,
  type PermissionMatrix,
  type PermissionResource,
} from "../rolesApi";

export interface PermissionMatrixProps {
  matrix: PermissionMatrix | null;
  /** The codes granted. */
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

  /** Grant `cell` at `scope`, or clear it. A rung carries every narrower
   * one, matching what the backend stores. */
  function setScope(cell: PermissionCell, scope: string) {
    if (!onChange) return;
    const next = new Set(selected);
    for (const code of cellCodes(cell)) next.delete(code);
    const rung = cell.options.findIndex((option) => option.scope === scope);
    if (rung >= 0) {
      for (const option of cell.options.slice(rung)) next.add(option.code);
    }
    onChange(next);
  }

  /** The rungs this viewer may actually hand out, widest first. */
  function offered(cell: PermissionCell) {
    const current = scopeOf(cell, selected);
    return cell.options.filter(
      // The rung already granted stays selectable, or the form cannot save.
      (option) => canConfer(option.code) || option.scope === current
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-erp-border bg-erp-header text-[11px] uppercase tracking-[.06em] text-erp-muted">
            <th className="px-3 py-2 text-left font-bold">Module</th>
            {matrix.verbs.map((verb) => (
              <th key={verb.key} className="px-2 py-2 text-left font-bold">
                {verb.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(([group, resources]) => (
            <GroupRows
              key={group}
              group={group}
              resources={resources}
              verbs={matrix.verbs.map((verb) => verb.key)}
              editable={editable}
              selected={selected}
              offered={offered}
              onSetScope={setScope}
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
  verbs,
  editable,
  selected,
  offered,
  onSetScope,
}: {
  group: string;
  resources: PermissionResource[];
  verbs: string[];
  editable: boolean;
  selected: ReadonlySet<string>;
  offered: (cell: PermissionCell) => PermissionCell["options"];
  onSetScope: (cell: PermissionCell, scope: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-erp-border-soft">
        <td
          colSpan={verbs.length + 1}
          className="bg-white px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[.08em] text-erp-brand-third"
        >
          {group}
        </td>
      </tr>
      {resources.map((resource) => {
        const cells = new Map(resource.cells.map((cell) => [cell.verb, cell]));
        return (
          <tr
            key={resource.key}
            className="border-b border-erp-border-soft hover:bg-erp-table-hover/40"
          >
            <td
              className="whitespace-nowrap px-3 py-2 text-erp-text"
              title={resource.help}
            >
              {resource.label}
            </td>
            {verbs.map((verb) => {
              const cell = cells.get(verb);
              if (!cell) {
                return (
                  <td key={verb} className="px-2 py-2 text-erp-muted/50">
                    —
                  </td>
                );
              }
              return (
                <td key={verb} className="px-2 py-2">
                  <ScopeCell
                    resource={resource}
                    cell={cell}
                    scope={scopeOf(cell, selected)}
                    editable={editable}
                    options={offered(cell)}
                    onChange={(next) => onSetScope(cell, next)}
                  />
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}

function ScopeCell({
  resource,
  cell,
  scope,
  editable,
  options,
  onChange,
}: {
  resource: PermissionResource;
  cell: PermissionCell;
  scope: string;
  editable: boolean;
  options: PermissionCell["options"];
  onChange: (scope: string) => void;
}) {
  const granted = scope !== NO_ACCESS;
  const label = `${resource.label}: ${cell.label}`;
  const id = `perm-${resource.key}-${cell.verb}`;

  // A workspace-wide verb has one rung, so it is a tick, not a dropdown.
  if (cell.options.length === 1) {
    const [only] = cell.options;
    if (!editable) {
      return <span className="text-erp-text">{granted ? "Yes" : "—"}</span>;
    }
    return (
      <Checkbox
        id={id}
        aria-label={label}
        hasHalo={false}
        checked={granted}
        disabled={!options.length}
        title={
          options.length ? only.code : "You cannot give access you do not hold yourself"
        }
        onChange={(event) => onChange(event.target.checked ? only.scope : NO_ACCESS)}
      />
    );
  }

  if (!editable) {
    const current = cell.options.find((option) => option.scope === scope);
    return <span className="text-erp-text">{current ? current.label : "—"}</span>;
  }

  return (
    <>
      {/* The column header alone does not name the row, and Dropdown takes
          no aria-label of its own. */}
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <FormDropdown
        id={id}
        chrome="underline"
        className="w-[150px]"
        value={scope}
        items={[
          { key: NO_ACCESS, label: "No access" },
          ...options.map((option) => ({ key: option.scope, label: option.label })),
        ]}
        onChange={(key) => onChange(key ?? NO_ACCESS)}
      />
    </>
  );
}
