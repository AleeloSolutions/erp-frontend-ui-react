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
import { useQuery } from "@tanstack/react-query";
import { apiGetPage } from "@/lib/api-client";
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
  // Branches, not a module's list: this page demonstrates @erp/ui and
  // must keep compiling in a build that carries no business modules.
  const branchesQuery = useQuery({
    queryKey: ["components-demo", "branches"],
    queryFn: () =>
      apiGetPage<{ uuid: string; name: string; is_archived: boolean }>(
        "/v1/branches/?page=1&page_size=5"
      ),
  });

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
        description="Live list query with loading / error / success states (the workspace's branches)."
      >
        <div className="mb-2 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => void branchesQuery.refetch()}
            loading={branchesQuery.isFetching}
          >
            Refetch
          </Button>
          <span className="self-center text-[11px] text-erp-muted">
            {branchesQuery.isLoading
              ? "Loading…"
              : branchesQuery.isError
                ? branchesQuery.error.message
                : `${branchesQuery.data?.meta.total ?? 0} branches loaded`}
          </span>
        </div>
        <ul className="m-0 list-none space-y-1 p-0 text-[12px]">
          {(branchesQuery.data?.data ?? []).map((branch) => (
            <li
              key={branch.uuid}
              className="flex items-center justify-between rounded-md border border-erp-border-soft px-2.5 py-1.5"
            >
              <span className="font-bold text-erp-text">{branch.name}</span>
              <span className="text-erp-subtle">
                {branch.is_archived ? "Archived" : "Active"}
              </span>
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
          Drawers keep users in context while inspecting a record. Used on the Customers
          page for detail preview.
        </p>
      </Drawer>
    </>
  );
}
