import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  useToast,
} from "@erp/ui";
import { api, app } from "@kaabe/runtime";
import { TICKETS_QUERY_KEY, createTicket } from "../api";

export default function TicketFormPage() {
  const navbar = app.useNavbarDefaults({ brandLabel: "Point of Sale" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("0.00");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const create = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      toast({ title: "Ticket rung up", description: ticket.title, variant: "success" });
      void queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
      navigate("/pos/tickets");
    },
    onError: (error: unknown) => {
      if (error instanceof api.ApiError && error.fields) setFieldErrors(error.fields);
      toast({
        title: "Could not ring the ticket up",
        description: error instanceof api.ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    },
  });

  return (
    <app.AppShell activeNavKey="pos" navbar={navbar}>
      <PageHeader
        module="Point of Sale"
        section="Tickets"
        title="New ticket"
        icon={<Receipt className="h-4 w-4" aria-hidden />}
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Ring up a sale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[12px]">
          <label className="block">
            <span className="mb-1 block text-erp-muted">What was sold</span>
            <Input
              className="w-full"
              value={title}
              error={Boolean(fieldErrors.title)}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="2 × espresso"
            />
            {fieldErrors.title ? (
              <span className="text-erp-error">{fieldErrors.title[0]}</span>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-1 block text-erp-muted">Total</span>
            <Input
              className="w-40"
              value={total}
              inputMode="decimal"
              error={Boolean(fieldErrors.total_amount)}
              onChange={(event) => setTotal(event.target.value)}
            />
            {fieldErrors.total_amount ? (
              <span className="text-erp-error">{fieldErrors.total_amount[0]}</span>
            ) : null}
          </label>
          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              loading={create.isPending}
              disabled={!title.trim()}
              onClick={() => {
                setFieldErrors({});
                create.mutate({ title: title.trim(), total_amount: total.trim() || "0" });
              }}
            >
              Ring up
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/pos/tickets")}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </app.AppShell>
  );
}
