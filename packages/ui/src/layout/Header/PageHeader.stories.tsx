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
