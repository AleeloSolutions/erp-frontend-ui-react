import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Drawer,
  useToast,
} from "@erp/ui";
import { useCustomersQuery } from "@/modules/sales/api";

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
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function FeedbackAndQueryDemos() {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const customersQuery = useCustomersQuery({ page: 1, pageSize: 5 });

  return (
    <>
      <DemoSection
        title="Feedback — Toast, Confirm, Drawer"
        description="Shared feedback patterns for ERP actions (success, error, confirmation, side detail)."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="teal"
            onClick={() =>
              toast({
                title: "Saved",
                description: "Changes were saved successfully.",
                variant: "success",
              })
            }
          >
            Success toast
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              toast({
                title: "Request failed",
                description: "The mock API returned an error.",
                variant: "error",
              })
            }
          >
            Error toast
          </Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            Open confirm
          </Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
        </div>
      </DemoSection>

      <DemoSection
        title="TanStack Query — Customers"
        description="Mock list query with loading / error / success states (shared with /sales/customers)."
      >
        <div className="mb-2 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => void customersQuery.refetch()}
            loading={customersQuery.isFetching}
          >
            Refetch
          </Button>
          <span className="self-center text-[11px] text-erp-muted">
            {customersQuery.isLoading
              ? "Loading…"
              : customersQuery.isError
                ? customersQuery.error.message
                : `${customersQuery.data?.total ?? 0} customers loaded`}
          </span>
        </div>
        <ul className="m-0 list-none space-y-1 p-0 text-[12px]">
          {(customersQuery.data?.data ?? []).map((customer) => (
            <li
              key={customer.id}
              className="flex items-center justify-between rounded-md border border-erp-border-soft px-2.5 py-1.5"
            >
              <span className="font-bold text-erp-text">{customer.name}</span>
              <span className="text-erp-subtle">{customer.status}</span>
            </li>
          ))}
        </ul>
      </DemoSection>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm action?"
        description="This is a reusable confirm dialog built on Modal."
        confirmLabel="Yes, continue"
        loading={confirmLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmLoading(true);
          window.setTimeout(() => {
            setConfirmLoading(false);
            setConfirmOpen(false);
            toast({
              title: "Confirmed",
              description: "Action completed.",
              variant: "success",
            });
          }, 700);
        }}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Drawer panel"
        description="Side panel for record detail or quick actions."
        footer={
          <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="m-0 text-[12px] text-erp-muted">
          Drawers keep users in context while inspecting a record. Used on the
          Customers page for detail preview.
        </p>
      </Drawer>
    </>
  );
}
