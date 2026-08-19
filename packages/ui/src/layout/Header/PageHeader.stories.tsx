import type { Meta, StoryObj } from "@storybook/react";
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

export const WithoutSubmenu: Story = {
  name: "Without submenu",
};

export const WithSubmenu: Story = {
  name: "With submenu",
  args: {
    submenu: {
      module: "Sales",
      items: [
        ...demoSubmenu,
        {
          key: "invoicing",
          label: "Invoicing",
          href: "/sales/invoicing",
          children: [
            { key: "invoices", label: "Invoices", href: "/sales/invoices" },
            { key: "credit-notes", label: "Credit Notes", href: "/sales/credit-notes" },
            { key: "payments", label: "Payments", href: "/sales/payments" },
          ],
        },
      ],
      activeKey: "customers",
    },
  },
};
