import type { Meta, StoryObj } from "@storybook/react";
import { FilterBar } from "../FilterBar";

const meta = {
  title: "Composites/FilterBar",
  component: FilterBar,
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithChips: Story = {
  args: {
    resultCount: 24,
    chips: [
      {
        key: "search",
        label: "Search",
        value: "acme",
        onRemove: () => undefined,
      },
      {
        key: "status",
        label: "Status",
        value: "Active",
        onRemove: () => undefined,
      },
    ],
    onClearAll: () => undefined,
  },
};

export const Empty: Story = {
  args: {
    resultCount: 0,
    chips: [],
  },
};
