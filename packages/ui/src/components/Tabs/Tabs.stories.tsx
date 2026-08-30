import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, type TabItem } from "./Tabs";

const demoItems: TabItem[] = [
  { key: "invoice_tab", label: "Invoice Lines" },
  { key: "aml_tab", label: "Journal Items" },
  { key: "other_info", label: "Other Info" },
];

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  args: {
    items: demoItems,
    activeKey: "invoice_tab",
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
  render: function InteractiveTabs() {
    const [activeKey, setActiveKey] = useState("invoice_tab");
    return <Tabs items={demoItems} activeKey={activeKey} onChange={setActiveKey} />;
  },
};

export const ContainerAligned: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-3xl border border-erp-border bg-white">
        <Story />
      </div>
    ),
  ],
  args: {
    align: "container",
  },
};

export const BleedAligned: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-3xl border border-erp-border bg-white px-12">
        <Story />
      </div>
    ),
  ],
  args: {
    align: "bleed",
  },
};

export const WithDisabled: Story = {
  args: {
    items: [...demoItems, { key: "locked", label: "Locked", disabled: true }],
  },
};
