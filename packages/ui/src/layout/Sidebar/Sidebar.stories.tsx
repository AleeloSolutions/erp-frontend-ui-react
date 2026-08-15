import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar";
import { RouterDecorator, demoNavigation } from "../../storybook/demo-nav";

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <div className="h-[480px] overflow-hidden rounded-lg border border-erp-border">
          <Story />
        </div>
      </RouterDecorator>
    ),
  ],
  args: {
    items: demoNavigation,
    activeKey: "sales",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
