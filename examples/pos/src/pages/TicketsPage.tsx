import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Receipt } from "lucide-react";
import {
  ControlPanel,
  DataTable,
  PageActions,
  PageHeader,
  StatusBadge,
  formatCurrency,
  useToast,
  type DataTableRowAction,
} from "@erp/ui";
import { api, app } from "@kaabe/runtime";
import {
  TICKETS_QUERY_KEY,
  listTickets,
  payTicket,
  voidTicket,
  type Ticket,
} from "../api";

const STATUS_LABEL: Record<Ticket["status"], { status: string; label: string }> = {
  open: { status: "open", label: "Open" },
  paid: { status: "paid", label: "Paid" },
  void: { status: "inactive", label: "Void" },
};

export default function TicketsPage() {
  const navbar = app.useNavbarDefaults({ brandLabel: "Point of Sale" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tickets = useQuery({ queryKey: TICKETS_QUERY_KEY, queryFn: listTickets });

  const settle = useMutation({
    mutationFn: ({ uuid, action }: { uuid: string; action: "pay" | "void" }) =>
      action === "pay" ? payTicket(uuid) : voidTicket(uuid),
    onSuccess: (ticket) => {
      toast({
        title: ticket.status === "paid" ? "Ticket paid" : "Ticket voided",
        description: ticket.title,
        variant: "success",
      });
      void queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
    onError: (error: unknown) => {
      toast({
        title: "Could not update the ticket",
        description: error instanceof api.ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    },
  });

  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      { accessorKey: "title", header: "Ticket", meta: { fill: true }, size: 260 },
      {
        id: "status",
        header: "Status",
        size: 110,
        cell: ({ row }) => {
          const badge = STATUS_LABEL[row.original.status];
          return <StatusBadge status={badge.status} label={badge.label} />;
        },
      },
      {
        accessorKey: "total_amount",
        header: "Total",
        size: 120,
        cell: ({ row }) => formatCurrency(Number(row.original.total_amount)),
      },
      {
        id: "branch",
        header: "Branch",
        size: 120,
        cell: ({ row }) => row.original.branch.code,
      },
      {
        id: "created_at",
        header: "Rung up",
        size: 170,
        cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
      },
    ],
    []
  );

  function rowActions(ticket: Ticket): DataTableRowAction[] {
    if (ticket.status !== "open") return [];
    return [
      {
        key: "pay",
        label: "Mark paid",
        onClick: () => settle.mutate({ uuid: ticket.uuid, action: "pay" }),
      },
      {
        key: "void",
        label: "Void",
        danger: true,
        onClick: () => settle.mutate({ uuid: ticket.uuid, action: "void" }),
      },
    ];
  }

  return (
    <app.AppShell activeNavKey="pos" navbar={navbar}>
      <PageHeader
        module="Point of Sale"
        section="Tickets"
        title="Tickets"
        description="Sales rung up at the till, and their settlement."
        icon={<Receipt className="h-4 w-4" aria-hidden />}
      />
      <DataTable
        tableId="pos-tickets"
        renderToolbar={({ searchFilter }) => (
          <ControlPanel
            pageActions={
              <PageActions
                buttons={[
                  {
                    key: "new",
                    children: "New ticket",
                    variant: "primary",
                    size: "sm",
                    onClick: () => navigate("/pos/tickets/new"),
                  },
                ]}
              />
            }
          >
            {searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        data={tickets.data ?? []}
        searchable
        searchPlaceholder="Search tickets…"
        loading={tickets.isPending}
        error={tickets.error ? tickets.error.message : null}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={false}
        emptyMessage="No tickets yet. Ring one up."
      />
    </app.AppShell>
  );
}
