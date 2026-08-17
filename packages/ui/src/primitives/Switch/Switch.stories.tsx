import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./Switch";

const meta = {
  title: "Primitives/Switch",
  component: Switch,
  args: {
    id: "demo-switch",
    label: "Email notifications",
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const DisabledOff: Story = {
  args: { disabled: true, label: "SMS notifications" },
};
