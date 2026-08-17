import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { DataTable } from "./DataTable";
import { StatusBadge } from "../../primitives/StatusBadge";
import { Button } from "../../primitives/Button";

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

const groupingOptions = [
  { label: "Customer", value: "name" },
  { label: "Country", value: "country" },
  { label: "Owner", value: "owner" },
  { label: "Status", value: "status" },
  { label: "Created", value: "created" },
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

const countryFilters = [
  {
    key: "country",
    label: "Country",
    type: "select" as const,
    options: [
      { label: "Somalia", value: "Somalia" },
      { label: "Kenya", value: "Kenya" },
      { label: "UAE", value: "UAE" },
      { label: "Djibouti", value: "Djibouti" },
      { label: "Ethiopia", value: "Ethiopia" },
    ],
  },
];

const meta = {
  title: "Composites/DataTable",
  component: DataTable,
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

export const Default: Story = {
  args: {
    tableId: "storybook-customers-default",
    columns,
    data,
    searchable: true,
    searchPlaceholder: "Search customers",
    selectable: true,
    enableGrouping: true,
    groupingOptions,
    filters: [...statusFilters, ...countryFilters],
    bulkActions: [
      {
        label: "Export",
        onClick: () => undefined,
      },
    ],
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyMessage: "No customers found.",
  },
};

export const ErrorState: Story = {
  args: {
    columns,
    data: [],
    error: "Failed to load customers.",
  },
};

/** Single direct destructive action (no MoreHorizontal menu). */
export const DirectAction: Story = {
  args: {
    tableId: "storybook-customers-direct-action",
    columns: [
      ...columns,
      {
        id: "__actions",
        header: "",
        size: 52,
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
    searchable: true,
  },
};

/** Multiple contextual actions via getRowActions (MoreHorizontal menu). */
export const RowActionsMenu: Story = {
  args: {
    tableId: "storybook-customers-row-actions",
    columns,
    data,
    searchable: true,
    getRowActions: (row) => [
      {
        key: "view",
        label: "View",
        onClick: () => undefined,
      },
      {
        key: "edit",
        label: "Edit",
        onClick: () => undefined,
      },
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

/**
 * Table fills the container. Drag a column edge — the adjacent column absorbs
 * the space. Clipped cell text shows ellipsis. Search shell hosts query + chips;
 * Sort and Columns sit on the strip above the table.
 */
export const ResizablePersisted: Story = {
  args: {
    tableId: "storybook-customers-resize-v3",
    columns,
    data,
    searchable: true,
    enableColumnResizing: true,
    enableGrouping: true,
    groupingOptions,
    filters: statusFilters,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Filters = record conditions. Group By = column dimensions. SearchFilter panel hosts both; Sort/Columns on the strip above the table.",
      },
    },
  },
};

export const SearchFilterPanel: Story = {
  args: {
    tableId: "storybook-customers-searchfilter",
    columns,
    data,
    searchable: true,
    searchPlaceholder: "Search customers",
    selectable: true,
    enableGrouping: true,
    groupingOptions,
    filters: [...statusFilters, ...countryFilters],
  },
};
