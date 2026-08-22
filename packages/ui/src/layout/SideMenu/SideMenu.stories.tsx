import type { Meta, StoryObj } from "@storybook/react";
import { SideMenu } from "./SideMenu";
import { RouterDecorator, demoSubmenu } from "../../storybook/demo-nav";

const statementItems = [
  { key: "balance-sheet", label: "Balance Sheet", href: "/reports/balance-sheet" },
  { key: "profit-and-loss", label: "Profit and Loss", href: "/reports/profit-and-loss" },
  { key: "cash-flow", label: "Cash Flow Statement", href: "/reports/cash-flow" },
];

const meta = {
  title: "Layout/SideMenu",
  component: SideMenu,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <div className="flex h-[420px] overflow-hidden rounded-lg border border-erp-border">
          <Story />
        </div>
      </RouterDecorator>
    ),
  ],
  args: {
    label: "Statement Reports",
    items: statementItems,
    activeKey: "balance-sheet",
  },
} satisfies Meta<typeof SideMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutLabel: Story = {
  args: { label: undefined },
};

export const NoActiveItem: Story = {
  args: { activeKey: undefined },
};

export const LongerList: Story = {
  args: { label: "Sales", items: demoSubmenu, activeKey: "quotations" },
};
