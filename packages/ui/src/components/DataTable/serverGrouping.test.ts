import { describe, expect, it } from "vitest";
import {
  DATA_TABLE_NULL_GROUP_KEY,
  buildServerGroupSections,
  collectExpandedPathIds,
  dataTableGroupIndent,
  dataTableGroupPathFromId,
  dataTableGroupPathId,
} from "./serverGrouping";
import type { DataTableServerGroup, DataTableServerGroupNode } from "../../types/table";

interface Row {
  id: string;
}

function group(key: string | null, count = 10): DataTableServerGroup {
  return { key, label: key ?? "None", count, totals: {} };
}

function rowsNode(ids: string[], total = ids.length): DataTableServerGroupNode<Row> {
  return {
    kind: "rows",
    rows: ids.map((id) => ({ id })),
    loading: false,
    error: null,
    total,
  };
}

function groupsNode(keys: (string | null)[]): DataTableServerGroupNode<Row> {
  return { kind: "groups", groups: keys.map((key) => group(key)), loading: false };
}

const build = (
  groups: DataTableServerGroup[],
  expandedPathIds: string[],
  levelCount: number,
  nodes: Record<string, DataTableServerGroupNode<Row>>
) =>
  buildServerGroupSections<Row>({
    groups,
    expandedPathIds,
    levelCount,
    resolveNode: (pathId) => nodes[pathId],
  });

describe("dataTableGroupPathId", () => {
  it("round-trips a path, including the null-group identity", () => {
    const path = ["u-1", DATA_TABLE_NULL_GROUP_KEY, "2026-03"];
    expect(dataTableGroupPathFromId(dataTableGroupPathId(path))).toEqual(path);
  });

  it("leaves a one-element path as the bare identity, so single-level keys match", () => {
    expect(dataTableGroupPathId(["acc-1"])).toBe("acc-1");
  });

  it("does not collide when a key contains a separator-looking character", () => {
    const a = dataTableGroupPathId(["a/b", "c"]);
    const b = dataTableGroupPathId(["a", "b/c"]);
    expect(a).not.toBe(b);
  });
});

describe("dataTableGroupIndent", () => {
  it("leaves the outermost level flush", () => {
    expect(dataTableGroupIndent(0)).toBe(0);
  });

  it("grows by a decaying step and stops growing once capped", () => {
    const steps = Array.from({ length: 12 }, (_, depth) => dataTableGroupIndent(depth));
    const deltas = steps.slice(1).map((value, index) => value - steps[index]!);
    // Never widens as it goes deeper…
    deltas.forEach((delta, index) => {
      if (index === 0) return;
      expect(delta).toBeLessThanOrEqual(deltas[index - 1]!);
    });
    // …and the whole ramp is bounded, so depth 12 is still a usable table.
    expect(steps[11]).toBeLessThanOrEqual(96);
  });
});

describe("buildServerGroupSections", () => {
  it("keeps a collapsed group's rows out of the flat row model", () => {
    const { sections, rows } = build([group("a"), group("b")], [], 1, {
      a: rowsNode(["a1", "a2"]),
    });
    expect(rows).toEqual([]);
    expect(sections.map((section) => section.rowCount)).toEqual([0, 0]);
  });

  it("slices each open group's rows at its own offset", () => {
    const { sections, rows } = build([group("a"), group("b")], ["a", "b"], 1, {
      a: rowsNode(["a1", "a2"]),
      b: rowsNode(["b1"]),
    });
    expect(rows.map((row) => row.id)).toEqual(["a1", "a2", "b1"]);
    expect(sections.map((s) => [s.rowStart, s.rowCount])).toEqual([
      [0, 2],
      [2, 1],
    ]);
  });

  it("reports rows the server still holds, so the group can say N of M", () => {
    const { sections } = build([group("a", 312)], ["a"], 1, {
      a: rowsNode(["a1", "a2"], 312),
    });
    expect(sections[0]!.rowCount).toBe(2);
    expect(sections[0]!.rowTotal).toBe(312);
  });

  it("nests sub-groups under an open parent and puts rows only at the last level", () => {
    const parentPath = dataTableGroupPathId(["u-1"]);
    const childPath = dataTableGroupPathId(["u-1", "c-1"]);
    const { sections, rows } = build([group("u-1")], [parentPath, childPath], 2, {
      [parentPath]: groupsNode(["c-1", "c-2"]),
      [childPath]: rowsNode(["r1", "r2"]),
    });
    const parent = sections[0]!;
    expect(parent.contains).toBe("groups");
    expect(parent.rowCount).toBe(0);
    expect(parent.children.map((child) => child.identity)).toEqual(["c-1", "c-2"]);
    const child = parent.children[0]!;
    expect(child.depth).toBe(1);
    expect(child.contains).toBe("rows");
    expect(child.path).toEqual(["u-1", "c-1"]);
    expect(rows.map((row) => row.id)).toEqual(["r1", "r2"]);
  });

  it("renders nothing below a collapsed parent even when descendants stay open", () => {
    const parentPath = dataTableGroupPathId(["u-1"]);
    const childPath = dataTableGroupPathId(["u-1", "c-1"]);
    // The grandchild is still listed as expanded — the user only closed the top.
    const { sections, rows } = build([group("u-1")], [childPath], 2, {
      [parentPath]: groupsNode(["c-1"]),
      [childPath]: rowsNode(["r1"]),
    });
    expect(sections[0]!.expanded).toBe(false);
    expect(sections[0]!.children).toEqual([]);
    expect(rows).toEqual([]);
    expect(collectExpandedPathIds(sections)).toEqual([]);
  });

  it("restores the retained subtree when the parent is opened again", () => {
    const parentPath = dataTableGroupPathId(["u-1"]);
    const childPath = dataTableGroupPathId(["u-1", "c-1"]);
    const nodes = {
      [parentPath]: groupsNode(["c-1"]),
      [childPath]: rowsNode(["r1"]),
    };
    const { sections, rows } = build([group("u-1")], [parentPath, childPath], 2, nodes);
    expect(rows.map((row) => row.id)).toEqual(["r1"]);
    expect(collectExpandedPathIds(sections)).toEqual([parentPath, childPath]);
  });

  it("marks an opened node with no answer yet as loading, not empty", () => {
    const { sections } = build([group("a")], ["a"], 1, {});
    expect(sections[0]!.loading).toBe(true);
    expect(sections[0]!.error).toBeNull();
  });

  it("carries a node's error without dropping the group's own count and totals", () => {
    const { sections } = build([group("a", 42)], ["a"], 1, {
      a: { kind: "rows", rows: [], loading: false, error: "boom", total: 0 },
    });
    expect(sections[0]!.error).toBe("boom");
    expect(sections[0]!.group.count).toBe(42);
  });

  it("trusts the node's own kind over the depth it sits at", () => {
    // A three-level grouping whose top node came back holding rows: render the
    // rows rather than an empty sub-group level that will never arrive.
    const { sections, rows } = build([group("a")], ["a"], 3, {
      a: rowsNode(["r1"]),
    });
    expect(sections[0]!.contains).toBe("rows");
    expect(rows.map((row) => row.id)).toEqual(["r1"]);
  });

  it("addresses the null group by its sentinel at any depth", () => {
    const topPath = dataTableGroupPathId([DATA_TABLE_NULL_GROUP_KEY]);
    const deepPath = dataTableGroupPathId([
      DATA_TABLE_NULL_GROUP_KEY,
      DATA_TABLE_NULL_GROUP_KEY,
    ]);
    const { sections, rows } = build([group(null)], [topPath, deepPath], 2, {
      [topPath]: groupsNode([null]),
      [deepPath]: rowsNode(["r1"]),
    });
    expect(sections[0]!.identity).toBe(DATA_TABLE_NULL_GROUP_KEY);
    expect(sections[0]!.children[0]!.pathId).toBe(deepPath);
    expect(rows.map((row) => row.id)).toEqual(["r1"]);
  });
});
