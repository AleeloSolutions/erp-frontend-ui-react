import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: {
    children: "Save",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "teal", "danger", "ghost", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};

export const Loading: Story = {
  args: { variant: "primary", loading: true, children: "Saving" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};
