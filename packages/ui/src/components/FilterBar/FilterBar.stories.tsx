import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FilterBar } from "../FilterBar";
import type { DataTableChip } from "../../types/table";

const meta = {
  title: "Composites/FilterBar",
  component: FilterBar,
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const initialChips: DataTableChip[] = [
  { key: "search", label: "Search", value: "acme", onRemove: () => undefined },
  { key: "status", label: "Status", value: "Active", onRemove: () => undefined },
];

export const WithChips: Story = {
  render: function WithChipsStory() {
    const [chips, setChips] = useState(initialChips);

    const boundChips = chips.map((chip) => ({
      ...chip,
      onRemove: () =>
        setChips((current) => current.filter((item) => item.key !== chip.key)),
    }));

    return (
      <FilterBar
        chips={boundChips}
        onClearAll={boundChips.length ? () => setChips([]) : undefined}
      />
    );
  },
};

export const Empty: Story = {
  args: {
    chips: [],
  },
};

export const CustomEmptyHint: Story = {
  args: {
    chips: [],
    emptyHint: "No filters applied — showing all records.",
  },
};
