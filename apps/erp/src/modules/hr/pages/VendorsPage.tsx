import type { ColumnDef } from "@tanstack/react-table";
import { AppShell, PageHeader } from "@/app";
import { Button, DataTable } from "@erp/ui";
import { Plus, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVendorsQuery } from "../api";
import { vendorsSubmenu } from "@/modules/hr/manifest";
import type { DemoVendor } from "../data/demo-data";

function VendorsPage() {
  const navigate = useNavigate();
  const { data: vendors } = useVendorsQuery();
  const columns: ColumnDef<DemoVendor>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row, getValue }) => (
        <button
          type="button"
          className="font-bold text-[#2E5FA7] hover:underline"
          onClick={() => navigate(`/hr/vendors/${row.original.id}`)}
        >
          {String(getValue())}
        </button>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Mobile Number",
      accessorKey: "phone",
    },
    {
      header: "Status",
      accessorKey: "status",
    },
    {
      header: "Created",
      accessorKey: "created",
    },
    {
      id: "__actions",
      header: "Actions",
      enableSorting: false,
      size: 52,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${row.original.name}`}
          onClick={() => console.log(row.original.id)}
        >
          <Trash2 className="h-3.5 w-3.5 text-erp-error" />
        </Button>
      ),
    },
  ];
  return (
    <AppShell activeNavKey="vendors" activeMobileKey="tasks">
      <PageHeader
        module="HR"
        section="Vendors"
        title="Vendors"
        description="Manage vendors with contact information, payment terms, and order history."
        icon={<Users className="h-4 w-4" aria-hidden />}
        actions={
          <Button variant="primary" onClick={() => navigate("/hr/vendors/new")}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Create Vendor
          </Button>
        }
        submenu={{
          module: "Vendors",
          items: vendorsSubmenu,
          activeKey: "vendors",
        }}
        className="bg-red-500 max-w-full"
      />

      {/* Data table */}
      <DataTable
        columns={columns}
        data={vendors || []}
        loading={false}
        searchable
        selectable
        pagination
        pageSize={5}
        bulkActions={[
          {
            key: "delete",
            label: "Delete",
            variant: "danger",
            onClick: (rows) => console.log(rows),
          },
          
        ]}
      />
    </AppShell>);
}

export default VendorsPage;