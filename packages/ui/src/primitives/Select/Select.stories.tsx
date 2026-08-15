import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const options = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending", value: "pending", disabled: true },
];

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
  args: {
    options,
    placeholder: "Select status",
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "active",
  },
};

export const WithError: Story = {
  args: {
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "active",
  },
};
