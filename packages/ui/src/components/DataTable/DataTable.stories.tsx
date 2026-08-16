import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { DataTable } from "./DataTable";
import { StatusBadge } from "../../primitives/StatusBadge";
import { Button } from "../../primitives/Button";

type Row = {
  id: string;
  name: string;
  status: string;
  amount: number;
};

const data: Row[] = [
  {
    id: "1",
    name: "Acme Trading International Holdings LLC",
    status: "Active",
    amount: 1200,
  },
  { id: "2", name: "Nile Supplies", status: "Inactive", amount: 450 },
  {
    id: "3",
    name: "Sahara Logistics and Freight Partners",
    status: "Active",
    amount: 9800,
  },
  { id: "4", name: "Red Sea Imports", status: "Pending", amount: 220 },
];

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    meta: { fill: true, tooltip: "Customer display name" },
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
];

const meta = {
  title: "Composites/DataTable",
  component: DataTable,
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl">
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
    filters: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
          { label: "Pending", value: "Pending" },
        ],
      },
    ],
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
    filters: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
          { label: "Pending", value: "Pending" },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Medium centered SearchFilter: type to search, open panel for Filters/Group By (Favorites is UI-only). Sort and Columns sit on the strip above the table.",
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
    groupingOptions: [
      { label: "Status", value: "status" },
      { label: "Customer", value: "name" },
    ],
    filters: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
          { label: "Pending", value: "Pending" },
        ],
      },
    ],
  },
};
