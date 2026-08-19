import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { ControlPanel } from "../../layout/ControlPanel";
import { PageActions } from "../../layout/PageActions";
import { StatusBadge } from "../../primitives/StatusBadge";

type Row = {
  id: string;
  name: string;
  email: string;
  country: string;
  status: string;
  amount: number;
};

const data: Row[] = [
  {
    id: "1",
    name: "Acme Trading International Holdings LLC",
    email: "finance@acmetrading.example.com",
    country: "Somalia",
    status: "Active",
    amount: 1200,
  },
  {
    id: "2",
    name: "Nile Supplies",
    email: "accounts@nilesupplies.example.com",
    country: "Kenya",
    status: "Inactive",
    amount: 450,
  },
  {
    id: "3",
    name: "Sahara Logistics and Freight Partners",
    email: "billing@sahralogistics.example.com",
    country: "UAE",
    status: "Active",
    amount: 9800,
  },
  {
    id: "4",
    name: "Red Sea Imports",
    email: "procurement@redseaimports.example.com",
    country: "Djibouti",
    status: "Pending",
    amount: 220,
  },
  {
    id: "5",
    name: "HornRise Group",
    email: "ops@hornrise.example.com",
    country: "Somalia",
    status: "Active",
    amount: 3400,
  },
  {
    id: "6",
    name: "East Africa Supplies Ltd",
    email: "projects@eastafricasupplies.example.com",
    country: "Ethiopia",
    status: "Active",
    amount: 760,
  },
];

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    meta: { fill: true },
    cell: ({ getValue }) => (
      <button
        type="button"
        className="block max-w-full truncate text-start font-bold text-erp-primary hover:underline"
      >
        {String(getValue())}
      </button>
    ),
  },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "country", header: "Country" },
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
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "List table with ControlPanel toolbar: PageActions, SearchFilter / bulk actions, and pagination sit above the table, outside the table container.",
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
} satisfies Meta<typeof DataTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithControlPanel: Story = {
  name: "With ControlPanel",
  args: {
    tableId: "storybook-customers-control-panel",
    columns,
    data,
    searchable: true,
    searchPlaceholder: "Search customers",
    selectable: true,
    pageSize: 5,
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
      { label: "Export", onClick: () => undefined },
      { label: "Archive", variant: "danger", onClick: () => undefined },
    ],
    renderToolbar: ({ searchFilter, pagination, bulkActions }) => (
      <ControlPanel
        pageActions={
          <PageActions
            breadcrumb="Customers"
            buttons={[
              {
                key: "new",
                children: "New",
                variant: "primary",
                size: "sm",
                onClick: () => undefined,
              },
            ]}
          />
        }
        endSlot={pagination}
      >
        {bulkActions ?? searchFilter}
      </ControlPanel>
    ),
  },
};
