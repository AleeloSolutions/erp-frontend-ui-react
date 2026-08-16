import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AlignJustify } from "lucide-react";
import { SearchFilter, type SearchFilterChip } from "./SearchFilter";
import { Button } from "../../primitives/Button";

const meta = {
  title: "Composites/SearchFilter",
  component: SearchFilter,
} satisfies Meta<typeof SearchFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState("");
    return <SearchFilter value={value} onChange={setValue} />;
  },
};

export const WithChipsAndPanel: Story = {
  render: function WithChipsStory() {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(true);
    const [vat, setVat] = useState(true);
    const [invoices, setInvoices] = useState(true);
    const [group, setGroup] = useState("salesperson");

    const chips: SearchFilterChip[] = [
      vat
        ? {
            id: "vat",
            label: "Subject to VAT",
            onRemove: () => setVat(false),
          }
        : null,
      invoices
        ? {
            id: "invoices",
            label: "Customer Invoices",
            onRemove: () => setInvoices(false),
          }
        : null,
      group
        ? {
            id: "group",
            label: `Group: ${
              group === "salesperson"
                ? "Salesperson"
                : group === "company"
                  ? "Company"
                  : "Country"
            }`,
            onRemove: () => setGroup(""),
          }
        : null,
    ].filter(Boolean) as SearchFilterChip[];

    return (
      <div className="pb-56">
        <SearchFilter
          value={value}
          onChange={setValue}
          chips={chips}
          panelOpen={open}
          onPanelOpenChange={setOpen}
          filters={[
            {
              id: "vat",
              label: "Subject to VAT",
              checked: vat,
              onSelect: () => setVat((v) => !v),
            },
            {
              id: "invoices",
              label: "Customer Invoices",
              checked: invoices,
              onSelect: () => setInvoices((v) => !v),
            },
            {
              id: "bills",
              label: "Vendor Bills",
              checked: false,
              onSelect: () => undefined,
            },
            {
              id: "archived",
              label: "Archived",
              checked: false,
              dividerBefore: true,
              onSelect: () => undefined,
            },
          ]}
          groupBy={[
            {
              id: "salesperson",
              label: "Salesperson",
              active: group === "salesperson",
              onSelect: () => setGroup((g) => (g === "salesperson" ? "" : "salesperson")),
            },
            {
              id: "company",
              label: "Company",
              active: group === "company",
              onSelect: () => setGroup((g) => (g === "company" ? "" : "company")),
            },
            {
              id: "country",
              label: "Country",
              active: group === "country",
              onSelect: () => setGroup((g) => (g === "country" ? "" : "country")),
            },
          ]}
        />
      </div>
    );
  },
};

export const WithColumnsSlot: Story = {
  render: function ColumnsStory() {
    const [value, setValue] = useState("acme");
    return (
      <SearchFilter
        value={value}
        onChange={setValue}
        columnsSlot={
          <Button
            variant="secondary"
            size="icon"
            aria-label="Columns"
            className="h-9 w-9"
          >
            <AlignJustify className="h-3.5 w-3.5" aria-hidden />
          </Button>
        }
      />
    );
  },
};
