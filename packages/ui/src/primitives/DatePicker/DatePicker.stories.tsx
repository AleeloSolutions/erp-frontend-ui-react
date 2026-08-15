import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "./DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "Primitives/DatePicker",
  component: DatePicker,
  args: {
    defaultValue: "2026-08-15",
  },
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
