import type { Meta, StoryObj } from "@storybook/react";
import { Dropdown } from "./Dropdown";

const meta = {
  title: "Composites/Dropdown",
  component: Dropdown,
  args: {
    label: "Actions",
    items: [
      { key: "edit", label: "Edit", onClick: () => undefined },
      { key: "duplicate", label: "Duplicate", onClick: () => undefined },
      { key: "delete", label: "Delete", danger: true, onClick: () => undefined },
    ],
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AlignRight: Story = {
  args: { align: "right" },
};
