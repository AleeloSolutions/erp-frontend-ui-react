import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Button } from "../../primitives/Button";
import { RouterDecorator, demoSubmenu } from "../../storybook/demo-nav";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <Story />
      </RouterDecorator>
    ),
  ],
  args: {
    module: "Sales",
    section: "Customers",
    title: "Customers",
    description: "Manage customer accounts.",
    icon: <Users className="h-4 w-4" aria-hidden />,
    actions: <Button variant="primary">Create</Button>,
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSubmenu: Story = {
  args: {
    submenu: {
      module: "Sales",
      items: demoSubmenu,
      activeKey: "customers",
    },
  },
};

export const WithMeta: Story = {
  args: {
    meta: [
      { label: "Active", value: 128 },
      { label: "Open balance", value: "$42.1k" },
      { label: "Overdue", value: 6 },
    ],
  },
};

export const WithContextSelects: Story = {
  name: "Org + branch selects",
  render: function ContextSelectsStory() {
    const [organization, setOrganization] = useState("acme");
    const [branch, setBranch] = useState("hq");

    return (
      <PageHeader
        module="Sales"
        section="Customers"
        title="Customers"
        description="Manage customer accounts."
        icon={<Users className="h-4 w-4" aria-hidden />}
        actions={<Button variant="primary">Create</Button>}
        organizations={[
          { label: "Acme Holdings", value: "acme" },
          { label: "North Region", value: "north" },
        ]}
        branches={[
          { label: "HQ", value: "hq" },
          { label: "Mogadishu", value: "mga" },
        ]}
        organizationValue={organization}
        branchValue={branch}
        onOrganizationChange={setOrganization}
        onBranchChange={setBranch}
      />
    );
  },
};
