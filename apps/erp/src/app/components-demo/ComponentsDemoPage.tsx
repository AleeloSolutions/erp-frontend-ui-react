import { useState } from "react";
import {
  Bell,
  CircleHelp,
  FileText,
  Info,
} from "lucide-react";
import { AppShell, PageHeader } from "@/app";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dropdown,
  Input,
  Modal,
  Radio,
  Select,
  StatusBadge,
  Switch,
  Textarea,
  Tooltip,
} from "@erp/ui";
import { financeSubmenu } from "@/app/navigation";
import { DataTableDemos } from "./demo-tables";
import { FormDemos } from "./demo-forms";
import { FeedbackAndQueryDemos } from "./demo-feedback";

function Section({
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

export default function ComponentsDemoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState("horn");
  const [branch, setBranch] = useState("all");

  return (
    <AppShell activeNavKey="finance" activeMobileKey="tasks">
      <PageHeader
        module="Finance"
        section="Customer invoices"
        title="Customer Invoices"
        description="Component showcase for layout and UI primitives. No ERP business module yet."
        icon={<FileText className="h-4 w-4" aria-hidden />}
        organizations={[
          { label: "HornRise Group", value: "horn" },
          { label: "Somali Development Agency", value: "sda" },
        ]}
        branches={[
          { label: "All branches", value: "all" },
          { label: "Mogadishu", value: "mog" },
          { label: "Hargeisa", value: "har" },
          { label: "Garowe", value: "gar" },
        ]}
        organizationValue={organization}
        branchValue={branch}
        onOrganizationChange={setOrganization}
        onBranchChange={setBranch}
        tools={
          <>
            <Tooltip content="Notifications">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content="Help">
              <Button variant="ghost" size="icon" aria-label="Help">
                <CircleHelp className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <div className="grid h-[27px] w-[27px] place-items-center rounded-full border border-erp-input-border bg-gradient-to-b from-[#E8EEF6] to-[#DDE7F1] text-[10px] font-extrabold text-[#506176]">
              AM
            </div>
          </>
        }
        actions={
          <>
            <Button variant="secondary">Import</Button>
            <Button variant="secondary">Export</Button>
            <Button variant="primary">Create Invoice</Button>
          </>
        }
        submenu={{
          module: "Finance",
          items: financeSubmenu,
          activeKey: "invoices",
        }}
      />

      <Section
        title="Buttons"
        description="Primary, secondary, teal, danger, ghost, loading, and disabled states."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="teal">Teal</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 1200);
            }}
          >
            Loading demo
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section
        title="Inputs"
        description="Text inputs, selects, and textareas with normal, error, and disabled states."
      >
        <div className="grid grid-cols-1 gap-3 min-[721px]:grid-cols-3">
          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-[#4B5563]">Customer name</label>
            <Input placeholder="Enter customer name" />
          </div>
          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-[#4B5563]">Status</label>
            <Select
              placeholder="Select status"
              options={[
                { label: "Draft", value: "draft" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
              ]}
              defaultValue="draft"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-[#4B5563]">Disabled</label>
            <Input disabled value="Read only value" />
          </div>
          <div className="space-y-1 min-[721px]:col-span-2">
            <label className="text-[10.5px] font-semibold text-[#4B5563]">Notes</label>
            <Textarea placeholder="Additional notes" />
          </div>
          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-[#4B5563]">Error state</label>
            <Input error placeholder="Invalid value" defaultValue="bad@" />
            <p className="m-0 text-[10px] text-erp-error">Enter a valid email address.</p>
          </div>
        </div>
      </Section>

      <Section
        title="Badges & status"
        description="Generic badges and ERP status badges from the prototype."
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge>Default</Badge>
          <Badge variant="blue">Blue</Badge>
          <Badge variant="teal">Teal</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="purple">Purple</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status="Paid" />
          <StatusBadge status="Pending" />
          <StatusBadge status="Approved" />
          <StatusBadge status="Overdue" />
          <StatusBadge status="Draft" />
          <StatusBadge status="Partially paid" />
          <StatusBadge status="Active" />
          <StatusBadge status="Inactive" />
          <StatusBadge status="Open" />
          <StatusBadge status="Closed" />
        </div>
      </Section>

      <Section
        title="Selection controls"
        description="Checkboxes, radios, and switches."
      >
        <div className="flex flex-wrap gap-6">
          <div className="space-y-2">
            <Checkbox id="chk-1" label="Selectable row" defaultChecked />
            <Checkbox id="chk-2" label="Disabled option" disabled />
            <Checkbox id="chk-3" label="Indeterminate" indeterminate />
          </div>
          <div className="space-y-2">
            <Radio id="rad-1" name="priority" label="Low" defaultChecked />
            <Radio id="rad-2" name="priority" label="Medium" />
            <Radio id="rad-3" name="priority" label="High" />
          </div>
          <div className="space-y-2">
            <Switch id="sw-1" label="Email notifications" defaultChecked />
            <Switch id="sw-2" label="Disabled switch" disabled />
          </div>
        </div>
      </Section>

      <Section
        title="Dropdown, modal & tooltip"
        description="Interactive overlays with keyboard and click-outside support."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            label="Actions"
            items={[
              { key: "approve", label: "Approve", onClick: () => undefined },
              { key: "assign", label: "Assign", onClick: () => undefined },
              { key: "export", label: "Export", onClick: () => undefined },
              { key: "delete", label: "Delete", danger: true, onClick: () => undefined },
            ]}
          />
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Tooltip content="More information about this control">
            <Button variant="ghost" size="icon" aria-label="Info">
              <Info className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      </Section>

      <Section title="Cards" description="Surface containers matching prototype card density.">
        <div className="grid grid-cols-1 gap-3 min-[721px]:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] text-erp-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong className="text-erp-text">$10,000.00</strong>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <strong className="text-erp-text">$500.00</strong>
              </div>
              <div className="flex justify-between border-t border-erp-border pt-2 text-[13px]">
                <span className="font-bold text-erp-text">Total</span>
                <strong className="text-erp-text">$10,500.00</strong>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary">Cancel</Button>
              <div className="ml-auto flex gap-1.5">
                <Button variant="secondary">Save draft</Button>
                <Button variant="teal">Submit</Button>
              </div>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Empty card</CardTitle>
            </CardHeader>
            <CardContent className="grid min-h-[120px] place-items-center text-[11px] text-erp-subtle">
              Use cards for grouped interactive content and list shells.
            </CardContent>
          </Card>
        </div>
      </Section>

      <DataTableDemos />

      <FormDemos />

      <FeedbackAndQueryDemos />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm action"
        description="This is a reusable modal shell for confirmations and forms."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="m-0 text-[12px] text-erp-muted">
          Modal content stays generic. Business modules will compose their own body and actions.
        </p>
      </Modal>
    </AppShell>
  );
}
