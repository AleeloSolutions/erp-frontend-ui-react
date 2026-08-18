import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Trash2, Users } from "lucide-react";
import { DataTable } from "./DataTable";
import { StatusBadge } from "../../primitives/StatusBadge";
import { Button } from "../../primitives/Button";
import { PageHeader } from "../../layout/Header";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  owner: string;
  status: string;
  amount: number;
  created: string;
};

const data: Row[] = [
  {
    id: "1",
    name: "Acme Trading International Holdings LLC",
    email: "finance@acmetrading.example.com",
    phone: "615100074",
    country: "Somalia",
    owner: "Ahmed Hassan",
    status: "Active",
    amount: 1200,
    created: "05 Jul 2026",
  },
  {
    id: "2",
    name: "Nile Supplies",
    email: "accounts@nilesupplies.example.com",
    phone: "615200881",
    country: "Kenya",
    owner: "Fatima Ali",
    status: "Inactive",
    amount: 450,
    created: "12 Jun 2026",
  },
  {
    id: "3",
    name: "Sahara Logistics and Freight Partners",
    email: "billing@sahralogistics.example.com",
    phone: "615300442",
    country: "UAE",
    owner: "Omar Yusuf",
    status: "Active",
    amount: 9800,
    created: "28 May 2026",
  },
  {
    id: "4",
    name: "Red Sea Imports",
    email: "procurement@redseaimports.example.com",
    phone: "615400119",
    country: "Djibouti",
    owner: "Layla Mohamed",
    status: "Pending",
    amount: 220,
    created: "03 Apr 2026",
  },
  {
    id: "5",
    name: "HornRise Group",
    email: "ops@hornrise.example.com",
    phone: "615500337",
    country: "Somalia",
    owner: "Hassan Abdi",
    status: "Active",
    amount: 3400,
    created: "18 Mar 2026",
  },
  {
    id: "6",
    name: "East Africa Supplies Ltd",
    email: "projects@eastafricasupplies.example.com",
    phone: "615600928",
    country: "Ethiopia",
    owner: "Amina Noor",
    status: "Active",
    amount: 760,
    created: "09 Feb 2026",
  },
];

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    meta: { fill: true, tooltip: "Customer display name" },
    cell: ({ getValue }) => (
      <button
        type="button"
        className="block max-w-full truncate text-start font-bold text-erp-primary hover:underline"
      >
        {String(getValue())}
      </button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    meta: { tooltip: "Primary billing email" },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    meta: { align: "right" },
  },
  {
    accessorKey: "country",
    header: "Country",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
  },
  {
    accessorKey: "amount",
    header: "Balance",
    meta: { align: "right" },
    cell: ({ getValue }) => Number(getValue()).toLocaleString(),
  },
  {
    accessorKey: "created",
    header: "Created",
    meta: { align: "right" },
  },
];

const compactColumns = columns.slice(0, 5);

const groupingOptions = [
  { label: "Country", value: "country" },
  { label: "Owner", value: "owner" },
  { label: "Status", value: "status" },
];

const statusFilters = [
  {
    key: "status",
    label: "Status",
    type: "select" as const,
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
      { label: "Pending", value: "Pending" },
    ],
  },
];

const countryFilterOptions = [
  { label: "Somalia", value: "Somalia" },
  { label: "Kenya", value: "Kenya" },
  { label: "UAE", value: "UAE" },
  { label: "Djibouti", value: "Djibouti" },
  { label: "Ethiopia", value: "Ethiopia" },
];

const countryFilters = [
  {
    key: "country",
    label: "Country",
    type: "select" as const,
    options: countryFilterOptions,
  },
];

const multiCountryFilters = [
  {
    key: "country",
    label: "Country",
    type: "multi-select" as const,
    options: countryFilterOptions,
  },
];

const createdDateFilters = [
  {
    key: "created",
    label: "Created",
    type: "date" as const,
    options: [
      { label: "Jul 2026", value: "05 Jul 2026" },
      { label: "Jun 2026", value: "12 Jun 2026" },
      { label: "May 2026", value: "28 May 2026" },
      { label: "Apr 2026", value: "03 Apr 2026" },
      { label: "Mar 2026", value: "18 Mar 2026" },
      { label: "Feb 2026", value: "09 Feb 2026" },
    ],
  },
];

/** Full module list — only used by ListPage. */
const listPageTableArgs = {
  tableId: "storybook-customers-list-page",
  columns,
  data,
  searchable: true,
  searchPlaceholder: "Search customers",
  selectable: true,
  enableGrouping: true,
  groupingOptions: [
    { label: "Customer", value: "name" },
    { label: "Country", value: "country" },
    { label: "Owner", value: "owner" },
    { label: "Status", value: "status" },
  ],
  filters: [...statusFilters, ...countryFilters],
  bulkActions: [
    { label: "Export", onClick: () => undefined },
    { label: "Archive", variant: "danger" as const, onClick: () => undefined },
  ],
};

const meta = {
  title: "Composites/DataTable",
  component: DataTable,
  parameters: {
    docs: {
      description: {
        component:
          "Primary list surface for ERP modules. Each story below isolates one behavior — use List Page for the full composed route.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-6xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Search + Sort/Columns strip + paginated rows. No filters, grouping, or selection. */
export const Default: Story = {
  args: {
    tableId: "storybook-customers-default",
    columns: compactColumns,
    data,
    searchable: true,
    searchPlaceholder: "Search customers",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Baseline list: client search, column sort, and the header columns checkbox menu. Visibility persists under `erp.datatable.visibility.${tableId}`.",
      },
    },
  },
};

/** Skeleton rows while data loads. */
export const Loading: Story = {
  args: {
    columns: compactColumns,
    data: [],
    loading: true,
    searchable: false,
    pagination: false,
  },
};

/** Zero rows returned. */
export const Empty: Story = {
  args: {
    columns: compactColumns,
    data: [],
    emptyMessage: "No customers found.",
    searchable: false,
  },
};

/** Fetch or query failure message. */
export const ErrorState: Story = {
  args: {
    columns: compactColumns,
    data: [],
    error: "Failed to load customers.",
    searchable: false,
  },
};

/** Single explicit destructive control in `__actions` — no row menu. */
export const DirectAction: Story = {
  args: {
    tableId: "storybook-customers-direct-action",
    columns: [
      ...compactColumns,
      {
        id: "__actions",
        header: "",
        size: 36,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${row.original.name}`}
            onClick={() => undefined}
          >
            <Trash2 className="h-3.5 w-3.5 text-erp-error" />
          </Button>
        ),
      },
    ],
    data,
    searchable: false,
    enableColumnVisibility: false,
  },
};

/** MoreHorizontal contextual menu via `getRowActions`. */
export const RowActionsMenu: Story = {
  args: {
    tableId: "storybook-customers-row-actions",
    columns: compactColumns,
    data,
    searchable: false,
    getRowActions: (row) => [
      { key: "view", label: "View", onClick: () => undefined },
      { key: "edit", label: "Edit", onClick: () => undefined },
      {
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => undefined,
        disabled: row.status === "Inactive",
      },
    ],
  },
};

/** Drag column edges; widths persist when `tableId` is set. */
export const ResizablePersisted: Story = {
  args: {
    tableId: "storybook-customers-resize",
    columns,
    data,
    searchable: false,
    enableColumnResizing: true,
    enableColumnVisibility: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Column resize only. Reload to confirm localStorage persistence under `erp.datatable.sizing.${tableId}`.",
      },
    },
  },
};

/** DataTable wiring for SearchFilter: search, filter chips, Filters + Group By panel. */
export const SearchFilterPanel: Story = {
  args: {
    tableId: "storybook-customers-searchfilter",
    columns: compactColumns,
    data,
    searchable: true,
    searchPlaceholder: "Search customers",
    filters: [...statusFilters, ...countryFilters],
    enableGrouping: true,
    groupingOptions,
  },
  parameters: {
    docs: {
      description: {
        story:
          "SearchFilter with compact pager at the end of the search row. Open the panel for Filters and Group By. Sort/Columns stay on the table header.",
      },
    },
  },
};

/** PageHeader + full list table — the only story that combines every list feature. */
export const ListPage: Story = {
  render: function ListPageStory() {
    return (
      <div className="flex flex-col gap-2">
        <PageHeader
          module="Sales"
          section="Customers"
          title="Customers"
          description="Manage customer accounts and open balances."
          icon={<Users className="h-4 w-4" aria-hidden />}
          actions={<Button variant="primary">Create</Button>}
        />
        <DataTable {...listPageTableArgs} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "End-to-end module list route: header actions, search, filters, grouping, selection, and bulk actions.",
      },
    },
  },
};

/** Check rows to swap SearchFilter for the “N selected + Actions” bar. */
export const BulkSelection: Story = {
  args: {
    tableId: "storybook-customers-bulk",
    columns: compactColumns,
    data,
    selectable: true,
    searchable: true,
    searchPlaceholder: "Search customers",
    pageSize: 5,
    bulkActions: [
      { label: "Export", onClick: () => undefined },
      { label: "Archive", variant: "danger", onClick: () => undefined },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Check a row: SearchFilter is replaced by a joined “N selected” + Actions control. Hover rows for a light overlay; selected rows stay a 5% gray wash. X clears selection and restores search.",
      },
    },
  },
};

/** Embedded table — no search shell, selection, pagination, or column controls. */
export const SimpleList: Story = {
  args: {
    tableId: "storybook-customers-simple",
    columns: compactColumns.slice(0, 4),
    data,
    pagination: false,
    searchable: false,
    enableColumnVisibility: false,
    enableColumnResizing: false,
  },
};

/** Truncated cells and native title tooltips in a narrow container. */
export const NarrowContainer: Story = {
  args: {
    tableId: "storybook-customers-narrow",
    columns,
    data,
    searchable: false,
    enableColumnResizing: true,
    enableColumnVisibility: false,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Table layout only in a narrow width — hover clipped text for the overflow tooltip.",
      },
    },
  },
};

/** Filter panel field types: select, multi-select, and date options. */
export const FilterTypes: Story = {
  args: {
    tableId: "storybook-customers-filter-types",
    columns: compactColumns,
    data,
    searchable: false,
    enableGrouping: false,
    filters: [...statusFilters, ...multiCountryFilters, ...createdDateFilters],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Open the panel → Filters column only. Toggle Status, Country (multi), or Created (date options).",
      },
    },
  },
};

/** Group By dimensions reorganize rows under section headers. */
export const WithGrouping: Story = {
  args: {
    tableId: "storybook-customers-grouping",
    columns: compactColumns,
    data,
    searchable: false,
    filters: [],
    enableGrouping: true,
    groupingOptions,
  },
  parameters: {
    docs: {
      description: {
        story: "Open the panel → Group By column. Pick Country or Owner to group rows.",
      },
    },
  },
};

/** Parent supplies the current page slice and total count. */
export const ServerPagination: Story = {
  render: function ServerPaginationStory() {
    const [page, setPage] = useState(1);
    const pageSize = 3;
    const total = data.length;
    const pageData = useMemo(
      () => data.slice((page - 1) * pageSize, page * pageSize),
      [page]
    );

    return (
      <DataTable
        tableId="storybook-customers-server-page"
        columns={compactColumns}
        data={pageData}
        searchable={false}
        manualFiltering={true}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Server pagination only — parent passes one page of rows and handles `onPageChange`.",
      },
    },
  },
};

/** Controlled search with `manualFiltering` — parent owns filtering. */
export const ServerSearch: Story = {
  render: function ServerSearchStory() {
    const [search, setSearch] = useState("");
    const query = search.trim().toLowerCase();
    const filtered = useMemo(() => {
      if (!query) return data;
      return data.filter((row) =>
        [row.name, row.email, row.owner, row.country]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }, [query]);

    return (
      <DataTable
        tableId="storybook-customers-server-search"
        columns={compactColumns}
        data={filtered}
        searchable={true}
        searchPlaceholder="Search customers"
        search={{ value: search, onChange: setSearch }}
        manualFiltering={true}
        pagination={{
          page: 1,
          pageSize: 10,
          total: filtered.length,
          onPageChange: () => undefined,
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Controlled search + manualFiltering. Parent filters data; DataTable does not apply client-side search.",
      },
    },
  },
};
