import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { dataTableGroupKeyId, DATA_TABLE_NULL_GROUP_KEY } from "./serverGrouping";
import type {
  DataTableServerGroup,
  DataTableServerGroupAggregate,
  DataTableServerGroupRows,
} from "../../types/table";
import { ControlPanel } from "../../layout/ControlPanel";
import { PageActions } from "../../layout/PageActions";
import { StatusBadge } from "../../primitives/StatusBadge";

/* ------------------------------------------------------------------ */
/* A stand-in server                                                    */
/* ------------------------------------------------------------------ */

type OrderRow = {
  id: string;
  reference: string;
  account: string;
  date: string;
  currency: string;
  amount: string;
  status: string;
};

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

const STATUSES = ["Posted", "Draft", "Cancelled"];

/** Stable empty default — a fresh `[]` per render would churn the callbacks. */
const NO_KEYS: string[] = [];

/** Deterministic rows for a group — no randomness, so stories stay stable. */
function rowsForGroup(identity: string, group: DataTableServerGroup): OrderRow[] {
  const currencies = Object.keys(group.totals);
  const count = Math.min(group.count, 4);
  return Array.from({ length: count }, (_, index) => {
    const currency = currencies[index % currencies.length] ?? "USD";
    return {
      id: `${identity}-${index + 1}`,
      reference: `SO-2026-${String(1000 + group.count + index).slice(-4)}`,
      account: group.label,
      date: `2026-0${(index % 9) + 1}-1${index % 9}`,
      currency,
      amount: ((index + 1) * 1250.5).toFixed(2),
      status: STATUSES[index % STATUSES.length]!,
    };
  });
}

const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ getValue }) => (
      <span className="font-medium text-erp-primary">{String(getValue())}</span>
    ),
  },
  { accessorKey: "account", header: "Account", meta: { fill: true } },
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
/* Group fixtures                                                       */
/* ------------------------------------------------------------------ */

/** One page of groups per entry, as the server would hand them over. */
type GroupPages = DataTableServerGroup[][];

const ACCOUNT_GROUPS: GroupPages = [
  [
    {
      key: "acc-1",
      label: "Acme Trading International",
      count: 128,
      totals: { USD: "184320.00" },
    },
    { key: "acc-2", label: "Nile Supplies", count: 64, totals: { USD: "42110.50" } },
    { key: "acc-3", label: "Sahara Logistics", count: 41, totals: { USD: "31980.75" } },
    { key: "acc-4", label: "Red Sea Imports", count: 22, totals: { USD: "9120.00" } },
  ],
];

const MULTI_CURRENCY_GROUPS: GroupPages = [
  [
    {
      key: "acc-1",
      label: "Acme Trading International",
      count: 128,
      totals: { USD: "184320.00", SOS: "2450000.00" },
    },
    {
      key: "acc-2",
      label: "Nile Supplies",
      count: 64,
      totals: { USD: "42110.50", SOS: "1250000.00", AED: "18400.00" },
    },
    { key: "acc-3", label: "Sahara Logistics", count: 41, totals: { SOS: "980400.00" } },
  ],
];

/** Four pages of three, so the group pager has somewhere to go. */
const PAGED_GROUPS: GroupPages = [
  [
    { key: "m-2026-01", label: "January 2026", count: 310, totals: { USD: "412500.00" } },
    {
      key: "m-2026-02",
      label: "February 2026",
      count: 288,
      totals: { USD: "377210.00" },
    },
    { key: "m-2026-03", label: "March 2026", count: 341, totals: { USD: "455900.25" } },
  ],
  [
    { key: "m-2026-04", label: "April 2026", count: 276, totals: { USD: "331040.00" } },
    { key: "m-2026-05", label: "May 2026", count: 299, totals: { USD: "362870.50" } },
    { key: "m-2026-06", label: "June 2026", count: 318, totals: { USD: "401220.00" } },
  ],
  [
    { key: "m-2026-07", label: "July 2026", count: 264, totals: { USD: "318640.00" } },
    { key: "m-2026-08", label: "August 2026", count: 251, totals: { USD: "295310.75" } },
    {
      key: "m-2026-09",
      label: "September 2026",
      count: 207,
      totals: { USD: "244180.00" },
    },
  ],
];

const SALESPERSON_GROUPS: GroupPages = [
  [
    { key: "u-1", label: "Amina Yusuf", count: 84, totals: { USD: "96420.00" } },
    {
      key: "u-2",
      label: "Deqa Warsame",
      count: 52,
      totals: { USD: "58330.25", SOS: "740000.00" },
    },
    // key: null — the grouped column itself is null for these records.
    { key: null, label: "Unassigned", count: 17, totals: { USD: "9210.00" } },
  ],
];

const EMPTY_ROWS_GROUPS: GroupPages = [
  [
    {
      key: "acc-1",
      label: "Acme Trading International",
      count: 128,
      totals: { USD: "184320.00" },
    },
    // The group exists in the index but its rows came back empty — a stale
    // count, a permission filter, a race with a delete.
    { key: "acc-9", label: "Archived accounts", count: 3, totals: { USD: "0.00" } },
  ],
];

function aggregateOf(
  pages: GroupPages,
  override?: Partial<DataTableServerGroupAggregate>
): DataTableServerGroupAggregate {
  const groups = pages.flat();
  const totals: Record<string, string> = {};
  groups.forEach((group) => {
    Object.entries(group.totals).forEach(([currency, amount]) => {
      totals[currency] = (Number(totals[currency] ?? 0) + Number(amount)).toFixed(2);
    });
  });
  return {
    count: groups.reduce((sum, group) => sum + group.count, 0),
    totals,
    ...override,
  };
}

/* ------------------------------------------------------------------ */
/* Harness — a real, working fake server                                */
/* ------------------------------------------------------------------ */

interface HarnessProps {
  pages: GroupPages;
  aggregate: DataTableServerGroupAggregate;
  groupLabel: string;
  /** Row-fetch latency, so the in-group loading state is observable. */
  delayMs?: number;
  /** Group identities whose row fetch always fails. */
  failingKeys?: string[];
  /** Group identities that load successfully but hold no rows. */
  emptyKeys?: string[];
  tableId: string;
}

function ServerGroupedTable({
  pages,
  aggregate,
  groupLabel,
  delayMs = 600,
  failingKeys = NO_KEYS,
  emptyKeys = NO_KEYS,
  tableId,
}: HarnessProps) {
  const [page, setPage] = useState(1);
  const [rowsByGroup, setRowsByGroup] = useState<
    Record<string, DataTableServerGroupRows<OrderRow>>
  >({});
  const requested = useRef(new Set<string>());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const groupsByIdentity = useMemo(() => {
    const map = new Map<string, DataTableServerGroup>();
    pages.flat().forEach((group) => map.set(dataTableGroupKeyId(group.key), group));
    return map;
  }, [pages]);

  const fetchRows = useCallback(
    (identity: string) => {
      const group = groupsByIdentity.get(identity);
      if (!group) return;
      setRowsByGroup((prev) => ({
        ...prev,
        [identity]: { rows: [], loading: true, error: null, total: group.count },
      }));
      const timer = window.setTimeout(() => {
        setRowsByGroup((prev) => ({
          ...prev,
          [identity]: failingKeys.includes(identity)
            ? {
                rows: [],
                loading: false,
                error: "Upstream refused this group (HTTP 502).",
                total: group.count,
              }
            : {
                rows: emptyKeys.includes(identity) ? [] : rowsForGroup(identity, group),
                loading: false,
                error: null,
                total: group.count,
              },
        }));
      }, delayMs);
      timers.current.push(timer);
    },
    [groupsByIdentity, failingKeys, emptyKeys, delayMs]
  );

  const handleExpandedChange = useCallback(
    (expandedKeys: string[]) => {
      expandedKeys.forEach((identity) => {
        if (requested.current.has(identity)) return;
        requested.current.add(identity);
        fetchRows(identity);
      });
    },
    [fetchRows]
  );

  const groups = pages[page - 1] ?? [];
  const totalGroups = pages.reduce((sum, entry) => sum + entry.length, 0);
  const groupPageSize = pages[0]?.length ?? groups.length;

  return (
    <DataTable<OrderRow>
      tableId={tableId}
      columns={columns}
      // Rows do not arrive with the group page — they are fetched per group.
      data={[]}
      manualFiltering
      getRowId={(row) => row.id}
      emptyMessage="No groups match the current filters."
      serverGrouping={{
        groups,
        aggregate,
        rowsByGroup,
        groupLabel,
        formatAmount,
        onExpandedChange: handleExpandedChange,
        onRetryGroup: fetchRows,
        pagination: {
          page,
          pageSize: groupPageSize,
          total: totalGroups,
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
  title: "Composites/DataTable/Server grouping",
  component: ServerGroupedTable,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Server-grouped DataTable: the server groups the **whole filtered set** and returns a page of groups",
          "with their counts and per-currency totals. Groups start collapsed; opening one asks the caller for",
          "that group's rows only. The footer shows the server's `aggregate` over every matching record — never",
          "the sum of the groups on screen — and the pager counts **groups**, not records.",
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
} satisfies Meta<typeof ServerGroupedTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  name: "Collapsed by default",
  parameters: {
    docs: {
      description: {
        story:
          "The resting state: every group closed, each showing its label, its total and its record count. Nothing has been fetched yet — opening a group is what triggers a row request.",
      },
    },
  },
  args: {
    tableId: "sb-server-grouping-collapsed",
    groupLabel: "Account",
    pages: ACCOUNT_GROUPS,
    aggregate: aggregateOf(ACCOUNT_GROUPS),
  },
};

export const SlowRowFetch: Story = {
  name: "Expanding — slow row fetch",
  parameters: {
    docs: {
      description: {
        story:
          "Rows take 4s. Open two groups at once: each shows its own loading line **inside** the group, and the other groups stay readable. A whole-table spinner here would blank out work that is already on screen.",
      },
    },
  },
  args: {
    tableId: "sb-server-grouping-slow",
    groupLabel: "Account",
    pages: ACCOUNT_GROUPS,
    aggregate: aggregateOf(ACCOUNT_GROUPS),
    delayMs: 4000,
  },
};

export const GroupRowsFail: Story = {
  name: "A group whose rows fail",
  parameters: {
    docs: {
      description: {
        story:
          "“Nile Supplies” always fails. Its error sits inside the group, tinted and iconed so it cannot be mistaken for the muted “no rows in this group” line, and Retry really re-issues the request. The group's own count and total still come from the group index, which loaded fine.",
      },
    },
  },
  args: {
    tableId: "sb-server-grouping-error",
    groupLabel: "Account",
    pages: ACCOUNT_GROUPS,
    aggregate: aggregateOf(ACCOUNT_GROUPS),
    delayMs: 800,
    failingKeys: ["acc-2"],
  },
};

export const EmptyGroup: Story = {
  name: "A group that loads no rows",
  parameters: {
    docs: {
      description: {
        story:
          "“Archived accounts” loads successfully with nothing in it. Compare it with the failure story: plain muted text, no tint, no retry — an empty group is not a broken one.",
      },
    },
  },
  args: {
    tableId: "sb-server-grouping-empty-group",
    groupLabel: "Account",
    pages: EMPTY_ROWS_GROUPS,
    aggregate: aggregateOf(EMPTY_ROWS_GROUPS),
    delayMs: 600,
    emptyKeys: ["acc-9"],
  },
};

export const MultiCurrencyTotals: Story = {
  name: "Multi-currency totals",
  parameters: {
    docs: {
      description: {
        story:
          "A tenant trading in three currencies. Each currency is printed on its own, separated by `·` — `$42,110.50 · Sh 1,250,000.00 · AED 18,400.00`. There is no exchange rate here, so the amounts are never added together, in the group rows or in the footer.",
      },
    },
  },
  args: {
    tableId: "sb-server-grouping-multi-currency",
    groupLabel: "Account",
    pages: MULTI_CURRENCY_GROUPS,
    aggregate: aggregateOf(MULTI_CURRENCY_GROUPS),
  },
};

export const AggregateBeyondVisibleGroups: Story = {
  name: "Aggregate ≠ sum of visible groups",
  parameters: {
    docs: {
      description: {
        story: [
          "The three visible groups hold 255 records and $89,210.50. The footer reports 4,820 records and",
          "$6,412,900.00, because `aggregate` describes the whole filtered set and the table takes it as given.",
          "Add the group rows up and you get the other number — which is exactly the bug this mode exists to",
          "prevent: a page-shaped total presented as the total.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-server-grouping-aggregate",
    groupLabel: "Account",
    pages: [
      [
        {
          key: "acc-1",
          label: "Acme Trading International",
          count: 128,
          totals: { USD: "42110.50" },
        },
        { key: "acc-2", label: "Nile Supplies", count: 84, totals: { USD: "31980.00" } },
        {
          key: "acc-3",
          label: "Sahara Logistics",
          count: 43,
          totals: { USD: "15120.00" },
        },
      ],
    ],
    aggregate: { count: 4820, totals: { USD: "6412900.00" } },
  },
};

export const GroupPager: Story = {
  name: "Paging through groups",
  parameters: {
    docs: {
      description: {
        story:
          "Nine groups over three pages. The pager reads “1-3 / 9 groups”, so the number can never be read as a record count — the footer's 2,554 records is the record number. Open a group, then page: expansion resets, because an open set from the previous page describes groups that are no longer on screen.",
      },
    },
  },
  args: {
    tableId: "sb-server-grouping-pager",
    groupLabel: "Month",
    pages: PAGED_GROUPS,
    aggregate: aggregateOf(PAGED_GROUPS),
    delayMs: 500,
  },
};

export const NullKeyGroup: Story = {
  name: "Null-key group",
  parameters: {
    docs: {
      description: {
        story: [
          "“Unassigned” is the group whose key is `null` — the grouped column itself was null for those records.",
          `It is addressed everywhere by \`${DATA_TABLE_NULL_GROUP_KEY}\`, the identity \`dataTableGroupKeyId(null)\``,
          "returns, so it keys `rowsByGroup` and travels through `onExpandedChange` like any other group. Open it:",
          "it fetches and renders exactly like the named ones.",
        ].join(" "),
      },
    },
  },
  args: {
    tableId: "sb-server-grouping-null-key",
    groupLabel: "Salesperson",
    pages: SALESPERSON_GROUPS,
    aggregate: aggregateOf(SALESPERSON_GROUPS),
    delayMs: 600,
  },
};
