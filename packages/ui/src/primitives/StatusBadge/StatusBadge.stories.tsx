import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "./StatusBadge";

const meta = {
  title: "Primitives/StatusBadge",
  component: StatusBadge,
  args: {
    status: "active",
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(
        [
          "paid",
          "pending",
          "approved",
          "overdue",
          "draft",
          "partial",
          "active",
          "inactive",
          "open",
          "closed",
        ] as const
      ).map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};

export const CustomLabel: Story = {
  args: { status: "pending", label: "Awaiting approval" },
};
