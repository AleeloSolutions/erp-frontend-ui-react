import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DataTableColumnsMenu } from "./DataTableColumnsMenu";

const labels = [
  "Journal",
  "Invoice Date",
  "Accounting Date",
  "Due Date",
  "Last Reminder",
  "Source Document",
  "Reference",
  "Salesperson",
  "Sales Team",
  "Activities",
  "Tax Excluded",
  "Tax",
  "Total",
  "Amount Due",
  "Invoice Currency",
  "Review",
  "Status",
  "Sent",
];

const meta = {
  title: "Composites/DataTable/ColumnsMenu",
  component: DataTableColumnsMenu,
  parameters: {
    docs: {
      description: {
        component:
          "Odoo optional-columns popover: checkbox list, stays open while toggling, fixed to the header control.",
      },
    },
  },
} satisfies Meta<typeof DataTableColumnsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    items: [],
  },
  render: function OpenStory() {
    const [visible, setVisible] = useState<Record<string, boolean>>(() =>
      Object.fromEntries(labels.map((label) => [label, true]))
    );
    const visibleCount = Object.values(visible).filter(Boolean).length;

    return (
      <div className="flex justify-end bg-erp-table-header p-2">
        <DataTableColumnsMenu
          defaultOpen
          items={labels.map((label) => ({
            id: label,
            label,
            isVisible: visible[label] ?? true,
            isDisabled: (visible[label] ?? true) && visibleCount <= 1,
            onToggle: () =>
              setVisible((current) => ({
                ...current,
                [label]: !current[label],
              })),
          }))}
        />
      </div>
    );
  },
};
