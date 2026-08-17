import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
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

export const Teal: Story = {
  args: { variant: "teal", children: "Submit" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Cancel" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Export" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" size="sm">
        Small
      </Button>
      <Button variant="primary" size="md">
        Medium
      </Button>
      <Button variant="primary" size="lg">
        Large
      </Button>
      <Button variant="primary" size="icon" aria-label="Add">
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { variant: "primary", loading: true, children: "Saving" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};
