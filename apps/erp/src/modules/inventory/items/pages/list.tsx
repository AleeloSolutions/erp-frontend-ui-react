import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Boxes } from "lucide-react";
import {
  ConfirmDialog,
  ControlPanel,
  DataTable,
  PageActions,
  PageHeader,
  useToast,
  type DataTableRowAction,
} from "@erp/ui";
import { api, app } from "@kaabe/runtime";
import { ITEMS_QUERY_KEY, deleteItem, listItems, type Item } from "../api";

export default function ItemsPage() {
  const navbar = app.useNavbarDefaults({ brandLabel: "Inventory" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const items = useQuery({ queryKey: ITEMS_QUERY_KEY, queryFn: listItems });
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const remove = useMutation({
    mutationFn: (uuid: string) => deleteItem(uuid),
    onSuccess: () => {
      toast({ title: "Item deleted", variant: "success" });
      void queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      setPendingDelete(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Could not delete",
        description: error instanceof api.ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    },
  });

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      { accessorKey: "title", header: "Item", meta: { fill: true }, size: 240 },
      { accessorKey: "sku", header: "SKU", size: 120 },
      {
        accessorKey: "quantity",
        header: "Qty",
        size: 100,
        cell: ({ row }) => row.original.quantity,
      },
      {
        id: "branch",
        header: "Branch",
        size: 100,
        cell: ({ row }) => row.original.branch.code,
      },
    ],
    []
  );

  function rowActions(item: Item): DataTableRowAction[] {
    return [
      {
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(item),
      },
    ];
  }

  return (
    <app.AppShell activeNavKey="inventory" navbar={navbar}>
      <PageHeader
        module="Inventory"
        section="Items"
        title="Items"
        description="Stock on hand for this workspace."
        icon={<Boxes className="h-4 w-4" aria-hidden />}
      />
      <DataTable
        tableId="inventory-items"
        renderToolbar={({ searchFilter }) => (
          <ControlPanel
            pageActions={
              <PageActions
                buttons={[
                  {
                    key: "new",
                    children: "New item",
                    variant: "primary",
                    size: "sm",
                    onClick: () => navigate("/inventory/items/new"),
                  },
                ]}
              />
            }
          >
            {searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        data={items.data ?? []}
        searchable
        searchPlaceholder="Search items…"
        loading={items.isPending}
        error={items.error ? items.error.message : null}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={false}
        emptyMessage="No items yet."
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? `Delete “${pendingDelete.title}”?` : "Delete?"}
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.uuid);
        }}
      />
    </app.AppShell>
  );
}
