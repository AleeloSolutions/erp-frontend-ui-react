import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
  args: {
    placeholder: "Add notes…",
    rows: 4,
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "Customer prefers email follow-up.",
  },
};

export const WithError: Story = {
  args: {
    error: true,
    defaultValue: "Too short",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Locked",
  },
};
