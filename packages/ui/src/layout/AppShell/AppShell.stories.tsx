import type { Meta, StoryObj } from "@storybook/react";
import { Users } from "lucide-react";
import { AppShell } from "./AppShell";
import { PageHeader } from "../Header";
import { Button } from "../../primitives/Button";
import { RouterDecorator, demoMobileNav, demoNavigation } from "../../storybook/demo-nav";

const meta = {
  title: "Layout/AppShell",
  component: AppShell,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <Story />
      </RouterDecorator>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    navigationItems: demoNavigation,
    mobileNavItems: demoMobileNav,
    activeNavKey: "sales",
    activeMobileKey: "sales",
    children: (
      <PageHeader
        module="Sales"
        section="Customers"
        title="Customers"
        description="Compose screens inside AppShell."
        icon={<Users className="h-4 w-4" aria-hidden />}
        actions={<Button variant="primary">Create</Button>}
      />
    ),
  },
};
