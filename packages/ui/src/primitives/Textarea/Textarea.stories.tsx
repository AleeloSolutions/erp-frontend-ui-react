import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { fieldMinWidthClasses } from "../../utils";

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
  args: {
    placeholder: "Description",
    size: "sm",
    className: fieldMinWidthClasses.sm,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "default"],
    },
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
    placeholder: "Notes",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Locked",
  },
};
