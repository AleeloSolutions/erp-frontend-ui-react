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
 * `readOnly` renders the same grid as a summary. `canConfer` hides rungs
 * the viewer does not hold themselves, because the API refuses to confer
 * those.
 *
 * `baseCodes` is what the person already holds through their role. Those
 * rungs draw as granted and locked -- change the role to change them --
 * and `selected` is only what is granted on top: a cell may be widened
 * beyond its base, never narrowed below it. The user form's Access Rights
 * tab is this grid with the role as the base and the extras as the ticks.
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
  /** Codes held through the role: shown granted, not editable here. */
  baseCodes?: ReadonlySet<string>;
  className?: string;
}

const NO_BASE: ReadonlySet<string> = new Set();

/** Position of `scope` on the cell's ladder (0 = widest); "none" sits past the end. */
function rungOf(cell: PermissionCell, scope: string): number {
  const index = cell.options.findIndex((option) => option.scope === scope);
  return index === -1 ? cell.options.length : index;
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
  baseCodes = NO_BASE,
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
    const rung = rungOf(cell, scope);
    // A rung the role already covers needs nothing granted on top.
    if (rung < cell.options.length && rung < rungOf(cell, scopeOf(cell, baseCodes))) {
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
              baseCodes={baseCodes}
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
  baseCodes,
  offered,
  onSetScope,
}: {
  group: string;
  resources: PermissionResource[];
  verbs: string[];
  editable: boolean;
  selected: ReadonlySet<string>;
  baseCodes: ReadonlySet<string>;
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
                    baseScope={scopeOf(cell, baseCodes)}
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
  baseScope,
  editable,
  options,
  onChange,
}: {
  resource: PermissionResource;
  cell: PermissionCell;
  /** The rung granted here: the extras on a user, or the role's own codes. */
  scope: string;
  /** The rung the role already gives; "none" when there is no base. */
  baseScope: string;
  editable: boolean;
  options: PermissionCell["options"];
  onChange: (scope: string) => void;
}) {
  // What the person ends up with: the wider of the two rungs.
  const effective = rungOf(cell, scope) <= rungOf(cell, baseScope) ? scope : baseScope;
  const granted = effective !== NO_ACCESS;
  const fromRole = baseScope !== NO_ACCESS && effective === baseScope;
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
        disabled={fromRole || !options.length}
        title={
          fromRole
            ? "Granted by the role: change the role to change this"
            : options.length
              ? only.code
              : "You cannot give access you do not hold yourself"
        }
        onChange={(event) => onChange(event.target.checked ? only.scope : NO_ACCESS)}
      />
    );
  }

  if (!editable) {
    const current = cell.options.find((option) => option.scope === effective);
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
        value={effective}
        items={[
          { key: NO_ACCESS, label: "No access", disabled: baseScope !== NO_ACCESS },
          ...options.map((option) => ({
            key: option.scope,
            label: option.scope === baseScope ? `${option.label} (role)` : option.label,
            // At or below the role's rung there is nothing to grant on top.
            disabled: rungOf(cell, option.scope) > rungOf(cell, baseScope),
          })),
        ]}
        onChange={(key) => onChange(key ?? NO_ACCESS)}
      />
    </>
  );
}
