import type { Meta, StoryObj } from "@storybook/react";
import { MobileNav } from "./MobileNav";
import { RouterDecorator, demoMobileNav } from "../../storybook/demo-nav";

const meta = {
  title: "Layout/MobileNav",
  component: MobileNav,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <div className="relative h-[120px] max-w-sm overflow-hidden rounded-lg border border-erp-border bg-erp-bg">
          <Story />
        </div>
      </RouterDecorator>
    ),
  ],
  args: {
    items: demoMobileNav,
    activeKey: "sales",
  },
} satisfies Meta<typeof MobileNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: demoMobileNav,
    activeKey: "sales",
    className: "!relative !inset-auto !flex h-14 w-full",
  },
};
