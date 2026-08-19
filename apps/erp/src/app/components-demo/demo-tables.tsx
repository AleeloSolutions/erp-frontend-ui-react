import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@erp/ui";
import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@erp/ui";
import {
  mockCustomers,
  mockInvoices,
  type DemoCustomer,
  type DemoInvoice,
} from "@/modules/sales/data/demo-table";
import type { DataTableFilter } from "@erp/ui";

function DemoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-3">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="m-0 mt-0.5 text-[11px] text-erp-subtle">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export function DataTableDemos() {
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const customerColumns = useMemo<ColumnDef<DemoCustomer>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ getValue }) => (
          <span className="font-bold text-erp-primary">{String(getValue())}</span>
        ),
        size: 220,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
      },
      {
        accessorKey: "phone",
        header: "Phone",
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
        size: 110,
      },
      {
        accessorKey: "created",
        header: "Created",
        size: 120,
      },
    ],
    []
  );

  const invoiceColumns = useMemo<ColumnDef<DemoInvoice>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Invoice number",
        cell: ({ getValue }) => (
          <span className="font-bold text-erp-primary">{String(getValue())}</span>
        ),
        size: 140,
      },
      {
        accessorKey: "customer",
        header: "Customer",
        size: 200,
      },
      {
        accessorKey: "date",
        header: "Date",
        size: 120,
      },
      {
        accessorKey: "dueDate",
        header: "Due date",
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
        size: 120,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        meta: { align: "right" },
        size: 100,
      },
    ],
    []
  );

  const customerFilters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        placeholder: "All statuses",
        options: [
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ],
      },
    ],
    []
  );

  const invoiceFilters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        placeholder: "All statuses",
        options: [
          { label: "Paid", value: "Paid" },
          { label: "Pending", value: "Pending" },
          { label: "Approved", value: "Approved" },
          { label: "Overdue", value: "Overdue" },
          { label: "Draft", value: "Draft" },
          { label: "Partially paid", value: "Partially paid" },
        ],
      },
    ],
    []
  );

  return (
    <>
      <DemoSection
        title="DataTable — Customers"
        description="Search, filters, sorting, pagination, selection, bulk actions, column visibility, and grouping."
      >
        <div className="flex flex-wrap gap-2 border-b border-erp-border-soft px-3 py-2">
          <Button
            variant="secondary"
            onClick={() => {
              setCustomerLoading(true);
              window.setTimeout(() => setCustomerLoading(false), 900);
            }}
          >
            Toggle loading
          </Button>
          <Button variant="secondary" onClick={() => setShowEmpty((value) => !value)}>
            {showEmpty ? "Show data" : "Show empty state"}
          </Button>
          {bulkMessage ? (
            <span className="self-center text-[11px] text-erp-blue">{bulkMessage}</span>
          ) : null}
        </div>
        <DataTable<DemoCustomer>
          columns={customerColumns}
          data={showEmpty ? [] : mockCustomers}
          searchable
          filters={customerFilters}
          selectable
          pagination
          pageSize={8}
          loading={customerLoading}
          enableGrouping
          groupingOptions={[
            { label: "Status", value: "status" },
            { label: "Created", value: "created" },
          ]}
          getRowId={(row) => row.id}
          bulkActions={[
            {
              key: "export",
              label: "Export",
              onClick: (rows) => setBulkMessage(`Exported ${rows.length} customer(s)`),
            },
            {
              key: "assign",
              label: "Assign",
              onClick: (rows) => setBulkMessage(`Assigned ${rows.length} customer(s)`),
            },
            {
              key: "delete",
              label: "Delete",
              variant: "danger",
              onClick: (rows) =>
                setBulkMessage(`Delete requested for ${rows.length} customer(s)`),
            },
          ]}
          className="rounded-none border-0"
        />
      </DemoSection>

      <DemoSection
        title="DataTable — Invoices"
        description="Invoice list with status badges, amount alignment, filters, and bulk actions."
      >
        <DataTable<DemoInvoice>
          columns={invoiceColumns}
          data={mockInvoices}
          searchable
          searchPlaceholder="Search invoices, customers, or amounts"
          filters={invoiceFilters}
          selectable
          pagination
          pageSize={8}
          enableGrouping
          groupingOptions={[
            { label: "Status", value: "status" },
            { label: "Customer", value: "customer" },
          ]}
          getRowId={(row) => row.id}
          bulkActions={[
            {
              key: "approve",
              label: "Approve",
              onClick: (rows) => setBulkMessage(`Approved ${rows.length} invoice(s)`),
            },
            {
              key: "export",
              label: "Export",
              onClick: (rows) => setBulkMessage(`Exported ${rows.length} invoice(s)`),
            },
          ]}
          className="rounded-none border-0"
        />
      </DemoSection>
    </>
  );
}
