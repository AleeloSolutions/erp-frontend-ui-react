import type { Meta, StoryObj } from "@storybook/react";
import { Radio } from "./Radio";

const meta = {
  title: "Primitives/Radio",
  component: Radio,
  args: {
    id: "demo-radio",
    name: "demo",
    label: "Monthly",
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true, label: "Disabled" },
};

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Billing plan">
      <Radio id="r1" name="plan" label="Monthly" defaultChecked />
      <Radio id="r2" name="plan" label="Yearly" />
      <Radio id="r3" name="plan" label="Disabled" disabled />
    </div>
  ),
};
