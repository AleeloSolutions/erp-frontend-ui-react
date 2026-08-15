import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
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
  { id: "1", name: "Acme Trading", status: "Active", amount: 1200 },
  { id: "2", name: "Nile Supplies", status: "Inactive", amount: 450 },
  { id: "3", name: "Sahara Logistics", status: "Active", amount: 9800 },
  { id: "4", name: "Red Sea Imports", status: "Pending", amount: 220 },
];

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    meta: { fill: true },
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
} satisfies Meta<typeof DataTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns,
    data,
    searchable: true,
    searchPlaceholder: "Search customers",
    selectable: true,
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

export const WithActions: Story = {
  args: {
    columns: [
      ...columns,
      {
        id: "__actions",
        header: "",
        size: 80,
        cell: () => (
          <Button variant="ghost" size="sm">
            View
          </Button>
        ),
      },
    ],
    data,
    searchable: true,
  },
};
