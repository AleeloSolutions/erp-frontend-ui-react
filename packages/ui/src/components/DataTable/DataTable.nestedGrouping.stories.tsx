import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import {
  DATA_TABLE_NULL_GROUP_KEY,
  dataTableGroupKeyId,
  dataTableGroupPathId,
} from "./serverGrouping";
import type { DataTableServerGroup, DataTableServerGroupNode } from "../../types/table";
import { ControlPanel } from "../../layout/ControlPanel";
import { PageActions } from "../../layout/PageActions";
import { StatusBadge } from "../../primitives/StatusBadge";

/* ------------------------------------------------------------------ */
/* A stand-in server with a real dataset behind it                      */
/* ------------------------------------------------------------------ */

interface Order {
  id: string;
  reference: string;
  salespersonKey: string | null;
  salesperson: string;
  customerKey: string | null;
  customer: string;
  /** ISO date. */
  date: string;
  currency: string;
  amount: string;
  status: string;
}

const CURRENCY_PREFIX: Record<string, string> = {
  USD: "$",
  SOS: "Sh ",
  AED: "AED ",
};

/**
 * The caller owns money formatting — the table is handed strings and a
 * formatter and never touches the numbers, least of all by adding two
 * currencies together.
 */
function formatAmount(amount: string, currency: string): string {
  const prefix = CURRENCY_PREFIX[currency] ?? `${currency} `;
  return `${prefix}${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Deterministic PRNG — the fixture must be identical on every reload. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Party {
  key: string | null;
  label: string;
  /** Relative frequency in the generated set. */
  weight: number;
}

const SALESPEOPLE: Party[] = [
  { key: "u-1", label: "Amina Yusuf", weight: 6 },
  { key: "u-2", label: "Deqa Warsame", weight: 5 },
  { key: "u-3", label: "Hodan Abdi", weight: 4 },
  { key: "u-4", label: "Yasin Muse", weight: 3 },
  // key: null — the grouped column itself is null for these records.
  { key: null, label: "Unassigned", weight: 2 },
];

const CUSTOMERS: Party[] = [
  { key: "c-1", label: "Acme Trading International", weight: 6 },
  { key: "c-2", label: "Nile Supplies", weight: 5 },
  { key: "c-3", label: "Sahara Logistics", weight: 4 },
  { key: "c-4", label: "Red Sea Imports", weight: 3 },
  { key: "c-5", label: "Berbera Freight", weight: 3 },
  // Null at depth 1: a record with no customer at all.
  { key: null, label: "No customer", weight: 2 },
];

const CURRENCIES = ["USD", "USD", "USD", "SOS", "AED"];
const STATUSES = ["Posted", "Draft", "Cancelled"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pickWeighted(list: Party[], roll: number): Party {
  const total = list.reduce((sum, item) => sum + item.weight, 0);
  let cursor = roll * total;
  for (const item of list) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return list[list.length - 1]!;
}

/**
 * 720 orders over two years. Everything the "server" answers — counts, totals,
 * sub-groups, row pages — is derived from this one array, so a header saying
 * 128 is followed by exactly 128 fetchable rows.
 */
const ORDERS: Order[] = (() => {
  const rand = mulberry32(20260917);
  return Array.from({ length: 720 }, (_, index) => {
    const salesperson = pickWeighted(SALESPEOPLE, rand());
    const customer = pickWeighted(CUSTOMERS, rand());
    const monthIndex = Math.floor(rand() * 24);
    const year = 2025 + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const day = 1 + Math.floor(rand() * 27);
    const currency = CURRENCIES[Math.floor(rand() * CURRENCIES.length)]!;
    return {
      id: `so-${index + 1}`,
      reference: `SO-${year}-${String(index + 1).padStart(4, "0")}`,
      salespersonKey: salesperson.key,
      salesperson: salesperson.label,
      customerKey: customer.key,
      customer: customer.label,
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      currency,
      amount: (250 + Math.floor(rand() * 9750)).toFixed(2),
      status: STATUSES[Math.floor(rand() * STATUSES.length)]!,
    };
  });
})();

/** One grouping dimension — a level of the chain. */
interface Dimension {
  id: string;
  label: string;
  keyOf: (order: Order) => string | null;
  labelOf: (order: Order) => string;
  /** Sort by key rather than label, so periods come out in time order. */
  chronological?: boolean;
}

const DIMENSIONS = {
  salesperson: {
    id: "salesperson",
    label: "Salesperson",
    keyOf: (order) => order.salespersonKey,
    labelOf: (order) => order.salesperson,
  },
  customer: {
    id: "customer",
    label: "Customer",
    keyOf: (order) => order.customerKey,
    labelOf: (order) => order.customer,
  },
  year: {
    id: "date:year",
    label: "Order Date: Year",
    keyOf: (order) => order.date.slice(0, 4),
    labelOf: (order) => order.date.slice(0, 4),
    chronological: true,
  },
  quarter: {
    id: "date:quarter",
    label: "Order Date: Quarter",
    keyOf: (order) =>
      `${order.date.slice(0, 4)}-Q${Math.floor((Number(order.date.slice(5, 7)) - 1) / 3) + 1}`,
    labelOf: (order) =>
      `Q${Math.floor((Number(order.date.slice(5, 7)) - 1) / 3) + 1} ${order.date.slice(0, 4)}`,
    chronological: true,
  },
  month: {
    id: "date:month",
    label: "Order Date: Month",
    keyOf: (order) => order.date.slice(0, 7),
    labelOf: (order) =>
      `${MONTH_NAMES[Number(order.date.slice(5, 7)) - 1]} ${order.date.slice(0, 4)}`,
    chronological: true,
  },
  status: {
    id: "status",
    label: "Status",
    keyOf: (order) => order.status,
    labelOf: (order) => order.status,
  },
  currency: {
    id: "currency",
    label: "Currency",
    keyOf: (order) => order.currency,
    labelOf: (order) => order.currency,
  },
} satisfies Record<string, Dimension>;

type DimensionId = keyof typeof DIMENSIONS;

/** Records under a path of group identities, outermost first. */
function ordersUnder(path: readonly string[], dims: Dimension[]): Order[] {
  if (path.length === 0) return ORDERS;
  return ORDERS.filter((order) =>
    path.every((segment, index) => {
      const dim = dims[index];
      return dim != null && dataTableGroupKeyId(dim.keyOf(order)) === segment;
    })
  );
}

/** Per-currency sums. Never one number: there is no rate to convert with. */
function totalsOf(orders: Order[]): Record<string, string> {
  const sums = new Map<string, number>();
  orders.forEach((order) => {
    sums.set(order.currency, (sums.get(order.currency) ?? 0) + Number(order.amount));
  });
  return Object.fromEntries(
    [...sums.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, amount]) => [currency, amount.toFixed(2)])
  );
}

/**
 * One level of groups under `path` — exactly what a `group_by` endpoint
 * returns for a further-filtered query, counts and totals included.
 */
function groupsUnder(path: readonly string[], dims: Dimension[]): DataTableServerGroup[] {
  const dim = dims[path.length];
  if (!dim) return [];
  const buckets = new Map<
    string,
    { key: string | null; label: string; orders: Order[] }
  >();
  ordersUnder(path, dims).forEach((order) => {
    const key = dim.keyOf(order);
    const identity = dataTableGroupKeyId(key);
    const bucket = buckets.get(identity) ?? {
      key,
      label: dim.labelOf(order),
      orders: [],
    };
    bucket.orders.push(order);
    buckets.set(identity, bucket);
  });
  return [...buckets.entries()]
    .sort(([aId, a], [bId, b]) =>
      dim.chronological ? aId.localeCompare(bId) : a.label.localeCompare(b.label)
    )
    .map(([, bucket]) => ({
      key: bucket.key,
      label: bucket.label,
      count: bucket.orders.length,
      totals: totalsOf(bucket.orders),
    }));
}

/** Grand total over the whole set — never derived from what is on screen. */
const AGGREGATE = { count: ORDERS.length, totals: totalsOf(ORDERS) };

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ getValue }) => (
      <span className="font-medium text-erp-primary">{String(getValue())}</span>
    ),
  },
  { accessorKey: "customer", header: "Customer", meta: { fill: true } },
  { accessorKey: "salesperson", header: "Salesperson" },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: { align: "right" },
    cell: ({ row }) => formatAmount(row.original.amount, row.original.currency),
  },
];

/* ------------------------------------------------------------------ */
/* Paths used by the failure / empty stories                            */
/* ------------------------------------------------------------------ */

const SALES_THEN_CUSTOMER: Dimension[] = [DIMENSIONS.salesperson, DIMENSIONS.customer];
const TOP_SALESPEOPLE = groupsUnder([], SALES_THEN_CUSTOMER);
const FIRST_SALESPERSON = TOP_SALESPEOPLE[0]!;
const FIRST_SALESPERSON_ID = dataTableGroupKeyId(FIRST_SALESPERSON.key);
const CUSTOMERS_UNDER_FIRST = groupsUnder([FIRST_SALESPERSON_ID], SALES_THEN_CUSTOMER);
/** Second customer under the first salesperson — derived, so it always exists. */
const BROKEN_CUSTOMER = CUSTOMERS_UNDER_FIRST[1] ?? CUSTOMERS_UNDER_FIRST[0]!;
const BROKEN_CUSTOMER_PATH = dataTableGroupPathId([
  FIRST_SALESPERSON_ID,
  dataTableGroupKeyId(BROKEN_CUSTOMER.key),
]);
const HOLLOW_CUSTOMER = CUSTOMERS_UNDER_FIRST[2] ?? CUSTOMERS_UNDER_FIRST[0]!;
const HOLLOW_CUSTOMER_PATH = dataTableGroupPathId([
  FIRST_SALESPERSON_ID,
  dataTableGroupKeyId(HOLLOW_CUSTOMER.key),
]);

/* ------------------------------------------------------------------ */
/* Harness — a real, working fake server, one level per request         */
/* ------------------------------------------------------------------ */

type NodeMap = Record<string, DataTableServerGroupNode<Order>>;

/** Stable empty defaults — a fresh `[]` per render would churn the callbacks. */
const NO_PATHS: string[] = [];

interface NestedHarnessProps {
  /** The grouping chain, outermost first. */
  dimensionIds: DimensionId[];
  /** Per-request latency, so lazy loading at depth is observable. */
  delayMs?: number;
  /** Rows one row request returns. */
  rowPageSize?: number;
  /** Top-level groups per page. */
  groupPageSize?: number;
  /** `dataTableGroupPathId` values whose fetch always fails. */
  failingPathIds?: string[];
  /** `dataTableGroupPathId` values that resolve with nothing under them. */
  emptyPathIds?: string[];
  /** False omits `onLoadMore`, leaving the count line with no control. */
  enableLoadMore?: boolean;
  tableId: string;
}

function NestedServerGroupedTable({
  dimensionIds,
  delayMs = 700,
  rowPageSize = 20,
  groupPageSize = 4,
  failingPathIds = NO_PATHS,
  emptyPathIds = NO_PATHS,
  enableLoadMore = true,
  tableId,
}: NestedHarnessProps) {
  const dims = useMemo(
    () => dimensionIds.map((id) => DIMENSIONS[id] as Dimension),
    [dimensionIds]
  );
  const topGroups = useMemo(() => groupsUnder([], dims), [dims]);
  const [page, setPage] = useState(1);
  const [nodes, setNodes] = useState<NodeMap>({});
  /** What the handlers read; `nodes` is what React renders. */
  const nodesRef = useRef<NodeMap>({});
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const commit = useCallback((next: NodeMap) => {
    nodesRef.current = next;
    setNodes(next);
  }, []);

  const schedule = useCallback(
    (run: () => void) => {
      timers.current.push(window.setTimeout(run, delayMs));
    },
    [delayMs]
  );

  /** A node at the last level holds records; every shallower one holds groups. */
  const holdsRows = useCallback(
    (path: readonly string[]) => path.length >= dims.length,
    [dims]
  );

  const answer = useCallback(
    (path: string[]): DataTableServerGroupNode<Order> => {
      const pathId = dataTableGroupPathId(path);
      const rows = holdsRows(path);
      if (failingPathIds.includes(pathId)) {
        const error = "Upstream refused this group (HTTP 502).";
        return rows
          ? { kind: "rows", rows: [], loading: false, error, total: 0 }
          : { kind: "groups", groups: [], loading: false, error };
      }
      if (emptyPathIds.includes(pathId)) {
        return rows
          ? { kind: "rows", rows: [], loading: false, error: null, total: 0 }
          : { kind: "groups", groups: [], loading: false, error: null };
      }
      if (rows) {
        const all = ordersUnder(path, dims);
        return {
          kind: "rows",
          rows: all.slice(0, rowPageSize),
          loading: false,
          error: null,
          total: all.length,
        };
      }
      return {
        kind: "groups",
        groups: groupsUnder(path, dims),
        loading: false,
        error: null,
      };
    },
    [dims, holdsRows, failingPathIds, emptyPathIds, rowPageSize]
  );

  /**
   * One node, lazily. Already-loaded nodes are served from the map without a
   * round trip — which is what makes re-opening a collapsed parent instant,
   * even though the table re-announces every descendant that comes back on
   * screen.
   */
  const fetchNode = useCallback(
    (path: string[], force = false) => {
      const pathId = dataTableGroupPathId(path);
      const existing = nodesRef.current[pathId];
      if (existing && !force && !existing.error && !existing.loading) return;
      if (existing?.loading && !force) return;
      commit({
        ...nodesRef.current,
        [pathId]: holdsRows(path)
          ? { kind: "rows", rows: [], loading: true, error: null, total: 0 }
          : { kind: "groups", groups: [], loading: true, error: null },
      });
      schedule(() => {
        commit({ ...nodesRef.current, [pathId]: answer(path) });
      });
    },
    [answer, commit, holdsRows, schedule]
  );

  /** The next `rowPageSize` records under this path, appended. */
  const loadMore = useCallback(
    (path: string[]) => {
      const pathId = dataTableGroupPathId(path);
      const current = nodesRef.current[pathId];
      if (!current || current.kind !== "rows" || current.loadingMore) return;
      commit({ ...nodesRef.current, [pathId]: { ...current, loadingMore: true } });
      schedule(() => {
        const latest = nodesRef.current[pathId];
        if (!latest || latest.kind !== "rows") return;
        const all = ordersUnder(path, dims);
        commit({
          ...nodesRef.current,
          [pathId]: {
            ...latest,
            rows: all.slice(0, latest.rows.length + rowPageSize),
            total: all.length,
            loadingMore: false,
          },
        });
      });
    },
    [commit, dims, rowPageSize, schedule]
  );

  const handleExpandedChange = useCallback(() => {
    // `nesting.onExpand` is the fetch trigger; this mirror exists for callers
    // that want to persist or report the open set, and is deliberately unused
    // here so the stories exercise the path API.
  }, []);

  const pageGroups = useMemo(
    () => topGroups.slice((page - 1) * groupPageSize, page * groupPageSize),
    [topGroups, page, groupPageSize]
  );

  const levels = useMemo(
    () => dims.map((dim) => ({ id: dim.id, label: dim.label })),
    [dims]
  );

  return (
    <DataTable<Order>
      tableId={tableId}
      columns={columns}
      // Nothing arrives with the group page — every level is fetched on open.
      data={[]}
      manualFiltering
      getRowId={(row) => row.id}
      emptyMessage="No groups match the current filters."
      serverGrouping={{
        groups: pageGroups,
        // The server's total over the WHOLE set. Adding the group rows up would
        // total only the groups on this page.
        aggregate: AGGREGATE,
        groupLabel: levels[0]?.label,
        formatAmount,
        rowPageSize,
        onExpandedChange: handleExpandedChange,
        nesting: {
          levels,
          nodesByPath: nodes,
          onExpand: fetchNode,
          onRetry: (path) => fetchNode(path, true),
          // Rule 3: the control exists only where something services it.
          onLoadMore: enableLoadMore ? loadMore : undefined,
        },
        pagination: {
          page,
          pageSize: groupPageSize,
          total: topGroups.length,
          onPageChange: setPage,
        },
      }}
      renderToolbar={({ pagination }) => (
        <ControlPanel
          pageActions={<PageActions breadcrumb="Orders" hideActions />}
          endSlot={pagination}
        />
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Stories                                                              */
/* ------------------------------------------------------------------ */

const meta = {
  title: "Composites/DataTable/Nested server grouping",
  component: NestedServerGroupedTable,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Server grouping nested to arbitrary depth — the Odoo shape,",
          "`Salesperson > Customer > Order Date: Year > Order Date: Quarter > Order Date: Month`.",
          "",
          "Each request answers **one level**: the page of top-level groups arrives first, and opening any node",
          "asks the caller for that node's children — sub-groups until the last level, records at it. Nothing",
          "below a closed node is fetched, and nothing below a closed node is rendered, whatever the caller",
          "still holds in `nodesByPath`.",
          "",
          "Every level carries its own count and its own per-currency totals, rendered exactly as the top level",
          "renders them. The footer stays the server's `aggregate` over the whole filtered set — a nested",
          "level's totals never reach it.",
          "",
          "The fake server behind these stories is real: 720 orders, genuine latency, genuine per-path lazy",
          "loading and a load-more that actually fetches.",
        ].join(" "),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen w-full bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NestedServerGroupedTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoLevels: Story = {
  name: "Two levels — Salesperson > Customer",
  parameters: {
    docs: {
      description: {
        story: [
          "Open a salesperson: you get **customers**, not orders — each with its own count and totals, summing",
          "to the salesperson above them. Open a customer and only then do rows appear. Two clicks, two",
          "requests; nothing is fetched speculatively.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-two",
    dimensionIds: ["salesperson", "customer"],
  },
};

export const ThreeLevels: Story = {
  name: "Three levels — … > Order Date: Month",
  parameters: {
    docs: {
      description: {
        story: [
          "`Salesperson > Customer > Order Date: Month`. The month groups are a period dimension, so they come",
          "back in time order rather than alphabetically — the server decides the order, the table renders it.",
          "Rows exist only under a month.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-three",
    dimensionIds: ["salesperson", "customer", "month"],
  },
};

export const MidLevelExpand: Story = {
  name: "Expanding a mid-level node",
  parameters: {
    docs: {
      description: {
        story: [
          "Same three levels with a deliberately slow server (2s). Open a salesperson, then a customer **while",
          "the first is still on screen**: each level shows its own loading line, indented where it belongs, and",
          "no other branch flickers or blanks. Then collapse the salesperson and open it again — its customers",
          "come straight back with no request, because the caller still holds those nodes, while the table had",
          "stopped rendering them the moment the parent closed.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-midlevel",
    dimensionIds: ["salesperson", "customer", "month"],
    delayMs: 2000,
  },
};

export const NestedNodeFails: Story = {
  name: "A nested node that fails",
  parameters: {
    docs: {
      description: {
        story: [
          `Open **${FIRST_SALESPERSON.label}**, then **${BROKEN_CUSTOMER.label}**: that one node always fails.`,
          "The error sits inside the node it belongs to, at its own indent, tinted and iconed so it cannot be",
          "read as the muted empty line — and Retry really re-issues that one request. Its siblings stay open",
          "and readable, and the counts above it still come from the level index, which loaded fine.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-error",
    dimensionIds: ["salesperson", "customer", "month"],
    delayMs: 800,
    failingPathIds: [BROKEN_CUSTOMER_PATH],
  },
};

export const NestedNodeEmpty: Story = {
  name: "A nested node with no sub-groups",
  parameters: {
    docs: {
      description: {
        story: [
          `Open **${FIRST_SALESPERSON.label}**, then **${HOLLOW_CUSTOMER.label}**: it resolves successfully with`,
          "nothing under it — a stale count, a permission filter, a race with a delete. It reads “No sub-groups",
          "in this group”, in plain muted text with no tint and no retry, because an empty node is not a broken",
          "one. Compare with the failure story above.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-empty",
    dimensionIds: ["salesperson", "customer", "month"],
    delayMs: 600,
    emptyPathIds: [HOLLOW_CUSTOMER_PATH],
  },
};

export const RowPagingAtDepth: Story = {
  name: "Load-more inside a nested group",
  parameters: {
    docs: {
      description: {
        story: [
          "Two levels, eight rows per request. Open any salesperson, then any customer: the header says (for",
          "example) 34 items and the group ends with **Showing 8 of 34** and a working **Load 8 more**. Press it",
          "and the next slice is genuinely fetched and appended — 16, 24, 32, 34 — and the line disappears once",
          "everything is loaded.",
          "",
          "Load-more rather than an in-group pager: at this depth several groups are open at once, and a pager",
          "per group would mean several page numbers to track and would swap out rows already read. Appending",
          "keeps the scroll position and keeps the count literally true about what is above it.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-load-more",
    dimensionIds: ["salesperson", "customer"],
    delayMs: 600,
    rowPageSize: 8,
  },
};

export const RowPagingWithoutHandler: Story = {
  name: "Partial rows, no load-more handler",
  parameters: {
    docs: {
      description: {
        story: [
          "The same tree with `nesting.onLoadMore` omitted. The count line stays — the user still has to know",
          "that 8 of 34 are on screen — but there is no button, because nothing would service it. Rule 3: never",
          "render a control that only looks interactive.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-no-load-more",
    dimensionIds: ["salesperson", "customer"],
    delayMs: 600,
    rowPageSize: 8,
    enableLoadMore: false,
  },
};

export const DeepChain: Story = {
  name: "Five levels — indentation at depth",
  parameters: {
    docs: {
      description: {
        story: [
          "`Salesperson > Customer > Year > Quarter > Month`. The indent step decays with depth (16, 16, 14, 12,",
          "10, then 8) and is capped, so level five is still legible without the first column having been eaten",
          "before the label starts. The pill on every row names its dimension, which is what keeps depth",
          "readable once the indent stops growing — you never have to count stripes to know what a row is.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-deep",
    dimensionIds: ["salesperson", "customer", "year", "quarter", "month"],
    delayMs: 450,
    rowPageSize: 10,
    groupPageSize: 3,
  },
};

export const SevenLevels: Story = {
  name: "Seven levels — the indent cap",
  parameters: {
    docs: {
      description: {
        story: [
          "`Salesperson > Customer > Year > Quarter > Month > Status > Currency` — the deepest chain the",
          "reference screenshots show. By level seven the indent has hit its ceiling and stops growing; the",
          "dimension pills and the collapsing chevrons carry the structure from there. Leaf groups are small at",
          "this depth, which is exactly what seven levels of grouping is for.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-seven",
    dimensionIds: [
      "salesperson",
      "customer",
      "year",
      "quarter",
      "month",
      "status",
      "currency",
    ],
    delayMs: 350,
    rowPageSize: 10,
    groupPageSize: 3,
  },
};

export const NullKeyAtDepth: Story = {
  name: "Null-key group at depth",
  parameters: {
    docs: {
      description: {
        story: [
          "Two null groups, one at each level: **Unassigned** at the top (no salesperson) and **No customer**",
          `inside every salesperson. Both are addressed by \`${DATA_TABLE_NULL_GROUP_KEY}\`, the identity`,
          "`dataTableGroupKeyId(null)` returns, so a path like `u-1 / __none__` keys `nodesByPath` and travels",
          "through `onExpand` like any other. Open “Unassigned”, then the “No customer” inside it: a path of two",
          "nulls still resolves to exactly one node.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-null-key",
    dimensionIds: ["salesperson", "customer", "month"],
    delayMs: 500,
  },
};

export const AggregateStaysTopLevel: Story = {
  name: "Footer ignores nested totals",
  parameters: {
    docs: {
      description: {
        story: [
          "Open as many nodes as you like at as many depths as you like: the footer never moves. It reports the",
          `server's aggregate over the whole filtered set — ${AGGREGATE.count} records — while every group row`,
          "reports its own level, scoped by the label beside it. The two numbers are different things and the",
          "table never lets one stand in for the other.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-nested-grouping-aggregate",
    dimensionIds: ["salesperson", "customer"],
    delayMs: 400,
    groupPageSize: 2,
  },
};
