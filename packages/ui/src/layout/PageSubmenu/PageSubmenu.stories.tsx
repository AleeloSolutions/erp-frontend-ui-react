import type { Meta, StoryObj } from "@storybook/react";
import { PageSubmenu } from "./PageSubmenu";
import { RouterDecorator, demoSubmenu } from "../../storybook/demo-nav";

const meta = {
  title: "Layout/PageSubmenu",
  component: PageSubmenu,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <div className="overflow-hidden rounded-lg border border-erp-border">
          <Story />
        </div>
      </RouterDecorator>
    ),
  ],
  args: {
    module: "Sales",
    items: demoSubmenu,
    activeKey: "customers",
  },
} satisfies Meta<typeof PageSubmenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutModule: Story = {
  args: {
    module: undefined,
  },
};
