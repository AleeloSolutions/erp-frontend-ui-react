import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ReactNode } from "react";
import { AlignJustify } from "lucide-react";
import { SearchFilter, type SearchFilterChip } from "./SearchFilter";
import { Button } from "../../primitives/Button";
import { Select } from "../../primitives/Select";

const meta = {
  title: "Composites/SearchFilter",
  component: SearchFilter,
  parameters: {
    docs: {
      description: {
        component:
          "Odoo-style search view: facet chips (filter = or, group = >) plus a caret-attached Filters / Group By / Favorites panel.",
      },
    },
  },
} satisfies Meta<typeof SearchFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Matches DataTable search strip — SearchFilter is centered, up to 600px. */
function ListSearchStrip({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-20 overflow-visible border-b border-erp-table-border bg-erp-table-header px-4 py-2">
      {children}
    </div>
  );
}

/** Empty search shell with panel toggle. */
export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState("");
    return (
      <ListSearchStrip>
        <SearchFilter value={value} onChange={setValue} />
      </ListSearchStrip>
    );
  },
};

/** No filter panel — search input only. */
export const SearchOnly: Story = {
  render: function SearchOnlyStory() {
    const [value, setValue] = useState("");
    return (
      <ListSearchStrip>
        <SearchFilter
          value={value}
          onChange={setValue}
          showPanel={false}
          placeholder="Search customers…"
        />
      </ListSearchStrip>
    );
  },
};

/** Filters column in the panel (record conditions). */
export const FilterPanel: Story = {
  render: function FilterPanelStory() {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(true);
    const [checked, setChecked] = useState<string[]>(["active"]);

    function toggle(id: string) {
      setChecked((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }

    const options = [
      { id: "mine", label: "My Invoices" },
      { id: "draft", label: "Draft", dividerBefore: true },
      { id: "posted", label: "Posted" },
      { id: "cancelled", label: "Cancelled" },
      { id: "active", label: "Active", dividerBefore: true },
      { id: "inactive", label: "Inactive" },
      { id: "pending", label: "Pending" },
    ];

    return (
      <div className="min-h-[28rem] pb-8">
        <ListSearchStrip>
          <SearchFilter
            value={value}
            onChange={setValue}
            panelOpen={open}
            onPanelOpenChange={setOpen}
            chips={(() => {
              const groups: { ids: string[]; labels: string[] }[] = [];
              let current: { ids: string[]; labels: string[] } = { ids: [], labels: [] };
              options.forEach((option, index) => {
                if (option.dividerBefore && index > 0 && current.ids.length > 0) {
                  groups.push(current);
                  current = { ids: [], labels: [] };
                }
                if (checked.includes(option.id)) {
                  current.ids.push(option.id);
                  current.labels.push(option.label);
                }
              });
              if (current.ids.length > 0) groups.push(current);
              return groups.map((group) => ({
                id: group.ids.join(":"),
                label: group.labels[0],
                values: group.labels,
                kind: "filter" as const,
                onRemove: () =>
                  setChecked((prev) => prev.filter((id) => !group.ids.includes(id))),
              }));
            })()}
            filters={options.map((option) => ({
              ...option,
              checked: checked.includes(option.id),
              onSelect: () => toggle(option.id),
            }))}
          />
        </ListSearchStrip>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Filters column only — toggle conditions and removable chips in the shell.",
      },
    },
  },
};

/** Group By column in the panel (column dimensions). */
export const GroupByPanel: Story = {
  render: function GroupByPanelStory() {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(true);
    const [group, setGroup] = useState("country");

    const groupLabel =
      group === "salesperson"
        ? "Salesperson"
        : group === "country"
          ? "Country"
          : group === "owner"
            ? "Owner"
            : "Status";

    return (
      <div className="min-h-[28rem] pb-8">
        <ListSearchStrip>
          <SearchFilter
            value={value}
            onChange={setValue}
            panelOpen={open}
            onPanelOpenChange={setOpen}
            chips={
              group
                ? [
                    {
                      id: "group",
                      label: groupLabel,
                      values: [groupLabel],
                      kind: "group",
                      onRemove: () => setGroup(""),
                    },
                  ]
                : []
            }
            groupBy={[
              {
                id: "salesperson",
                label: "Salesperson",
                active: group === "salesperson",
                onSelect: () =>
                  setGroup((g) => (g === "salesperson" ? "" : "salesperson")),
              },
              {
                id: "country",
                label: "Country",
                active: group === "country",
                onSelect: () => setGroup((g) => (g === "country" ? "" : "country")),
              },
              {
                id: "owner",
                label: "Owner",
                active: group === "owner",
                onSelect: () => setGroup((g) => (g === "owner" ? "" : "owner")),
              },
              {
                id: "status",
                label: "Status",
                active: group === "status",
                onSelect: () => setGroup((g) => (g === "status" ? "" : "status")),
              },
            ]}
          />
        </ListSearchStrip>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Group By column only — pick one dimension; chip reflects the active grouping.",
      },
    },
  },
};

/** Favorites column (saved searches — persistence is app-owned). */
export const WithFavorites: Story = {
  render: function FavoritesStory() {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(true);
    const [activeFavorite, setActiveFavorite] = useState("active-customers");

    return (
      <div className="min-h-[28rem] pb-8">
        <ListSearchStrip>
          <SearchFilter
            value={value}
            onChange={setValue}
            panelOpen={open}
            onPanelOpenChange={setOpen}
            chips={
              activeFavorite
                ? [
                    {
                      id: "fav",
                      label: "Active customers (HQ)",
                      values: ["Active customers (HQ)"],
                      kind: "filter",
                      onRemove: () => setActiveFavorite(""),
                    },
                  ]
                : []
            }
            favorites={[
              {
                id: "active-customers",
                label: "Active customers (HQ)",
                active: activeFavorite === "active-customers",
                onSelect: () => setActiveFavorite("active-customers"),
              },
              {
                id: "overdue",
                label: "Overdue balances",
                active: activeFavorite === "overdue",
                onSelect: () => setActiveFavorite("overdue"),
              },
              {
                id: "save-current",
                label: "Save current search",
                disabled: true,
              },
            ]}
          />
        </ListSearchStrip>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Favorites column only. “Save current search” is a disabled stub until the app wires persistence.",
      },
    },
  },
};

/** `columnsSlot` — optional control beside the search shell (e.g. Columns button). */
export const WithColumnsSlot: Story = {
  render: function ColumnsStory() {
    const [value, setValue] = useState("acme");
    return (
      <ListSearchStrip>
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
      </ListSearchStrip>
    );
  },
};

/**
 * List-page toolbar layout: search shell + Sort/Columns beside it.
 * DataTable places Sort/Columns on the strip below the table instead.
 */
export const FullListToolbar: Story = {
  render: function ToolbarStory() {
    const [value, setValue] = useState("acme");
    const [sort, setSort] = useState("default");

    return (
      <ListSearchStrip>
        <SearchFilter
          value={value}
          onChange={setValue}
          placeholder="Search customers"
          chips={[
            {
              id: "status",
              label: "Active",
              values: ["Active"],
              kind: "filter",
              onRemove: () => undefined,
            },
          ]}
          columnsSlot={
            <div className="flex items-stretch gap-2">
              <Select
                aria-label="Sort"
                size="sm"
                className="w-auto min-w-[5.25rem] [&>select]:!h-9 [&>select]:!min-h-9 [&>select]:!text-xs"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="default">Sort</option>
                <option value="name-asc">Customer · A–Z</option>
                <option value="name-desc">Customer · Z–A</option>
              </Select>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Columns"
                className="h-9 w-9"
              >
                <AlignJustify className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          }
        />
      </ListSearchStrip>
    );
  },
};

/** Extra facets wrap inside the search view — filters join with “or”, groups with “>”. */
export const ManyChips: Story = {
  render: function ManyChipsStory() {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(false);
    const [chips, setChips] = useState<SearchFilterChip[]>([
      {
        id: "status",
        label: "Draft",
        values: ["Draft", "Posted", "Cancelled"],
        kind: "filter",
        onRemove: () => undefined,
      },
      {
        id: "sent",
        label: "Not Sent",
        values: ["Not Sent"],
        kind: "filter",
        onRemove: () => undefined,
      },
      {
        id: "type",
        label: "Invoices",
        values: ["Invoices", "Credit Notes", "Receipts"],
        kind: "filter",
        onRemove: () => undefined,
      },
      {
        id: "review",
        label: "To Review",
        values: ["To Review"],
        kind: "filter",
        onRemove: () => undefined,
      },
      {
        id: "group",
        label: "Journal",
        values: [
          "Journal",
          "Payment Method",
          "Sales Team",
          "Status",
          "Partner",
          "Salesperson",
        ],
        kind: "group",
        onRemove: () => undefined,
      },
    ]);

    const removableChips = chips.map((chip) => ({
      ...chip,
      onRemove: () => setChips((prev) => prev.filter((item) => item.id !== chip.id)),
    }));

    return (
      <div className="min-h-[28rem] pb-8">
        <ListSearchStrip>
          <SearchFilter
            value={value}
            onChange={setValue}
            panelOpen={open}
            onPanelOpenChange={setOpen}
            chips={removableChips}
            placeholder="Search..."
            filters={[
              { id: "active", label: "Active", checked: true },
              { id: "inactive", label: "Inactive" },
            ]}
            groupBy={[
              { id: "country", label: "Country" },
              { id: "owner", label: "Owner" },
            ]}
          />
        </ListSearchStrip>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: (args) => (
    <ListSearchStrip>
      <SearchFilter {...args} />
    </ListSearchStrip>
  ),
  args: {
    value: "Locked query",
    onChange: () => undefined,
    disabled: true,
    chips: [
      {
        id: "status",
        label: "Active",
        values: ["Active"],
        kind: "filter",
        onRemove: () => undefined,
      },
    ],
  },
};

export const ReadOnly: Story = {
  render: (args) => (
    <ListSearchStrip>
      <SearchFilter {...args} />
    </ListSearchStrip>
  ),
  args: {
    value: "",
    onChange: () => undefined,
    readOnly: true,
    placeholder: "Search...",
    chips: [
      {
        id: "group",
        label: "Country",
        values: ["Country"],
        kind: "group",
        onRemove: () => undefined,
      },
    ],
  },
};
