import type { Meta, StoryObj } from "@storybook/react";
import { Radio } from "./Radio";

const meta = {
  title: "Primitives/Radio",
  component: Radio,
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Radio id="r1" name="plan" label="Monthly" defaultChecked />
      <Radio id="r2" name="plan" label="Yearly" />
      <Radio id="r3" name="plan" label="Disabled" disabled />
    </div>
  ),
};
