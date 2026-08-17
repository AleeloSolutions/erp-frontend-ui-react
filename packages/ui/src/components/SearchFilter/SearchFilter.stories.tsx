import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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
          "Search shell for list pages. Each story isolates one concern — see DataTable › Search Filter Panel for table integration.",
      },
    },
  },
} satisfies Meta<typeof SearchFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty search shell with panel toggle. */
export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState("");
    return <SearchFilter value={value} onChange={setValue} />;
  },
};

/** No filter panel — search input only. */
export const SearchOnly: Story = {
  render: function SearchOnlyStory() {
    const [value, setValue] = useState("");
    return (
      <SearchFilter
        value={value}
        onChange={setValue}
        showPanel={false}
        placeholder="Search customers…"
      />
    );
  },
};

/** Filters column in the panel (record conditions). */
export const FilterPanel: Story = {
  render: function FilterPanelStory() {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(true);
    const [active, setActive] = useState(true);
    const [inactive, setInactive] = useState(false);

    return (
      <div className="pb-56">
        <SearchFilter
          value={value}
          onChange={setValue}
          panelOpen={open}
          onPanelOpenChange={setOpen}
          chips={
            active
              ? [
                  {
                    id: "active",
                    label: "Status: Active",
                    onRemove: () => setActive(false),
                  },
                ]
              : []
          }
          filters={[
            {
              id: "active",
              label: "Active",
              checked: active,
              onSelect: () => setActive((v) => !v),
            },
            {
              id: "inactive",
              label: "Inactive",
              checked: inactive,
              onSelect: () => setInactive((v) => !v),
            },
            {
              id: "pending",
              label: "Pending",
              checked: false,
              onSelect: () => undefined,
            },
          ]}
        />
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
      group === "country" ? "Country" : group === "owner" ? "Owner" : "Status";

    return (
      <div className="pb-56">
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
                    label: `Group: ${groupLabel}`,
                    onRemove: () => setGroup(""),
                  },
                ]
              : []
          }
          groupBy={[
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
      <div className="pb-56">
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

/**
 * List-page toolbar layout: search shell + Sort/Columns beside it.
 * DataTable places Sort/Columns on the strip below the table instead.
 */
export const FullListToolbar: Story = {
  render: function ToolbarStory() {
    const [value, setValue] = useState("acme");
    const [sort, setSort] = useState("default");

    return (
      <div className="border-b border-erp-border bg-erp-surface-tint px-3 py-2.5">
        <SearchFilter
          value={value}
          onChange={setValue}
          placeholder="Search customers"
          chips={[{ id: "status", label: "Status: Active", onRemove: () => undefined }]}
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
      </div>
    );
  },
};

/** Many active chips + long query — shell wrap and truncation. */
export const ManyChips: Story = {
  render: function ManyChipsStory() {
    const [value, setValue] = useState("Acme Trading International Holdings");
    const chips: SearchFilterChip[] = [
      { id: "1", label: "Status: Active", onRemove: () => undefined },
      { id: "2", label: "Country: Somalia", onRemove: () => undefined },
      { id: "3", label: "Country: Kenya", onRemove: () => undefined },
      { id: "4", label: "Group: Owner", onRemove: () => undefined },
      { id: "5", label: "Subject to VAT", onRemove: () => undefined },
    ];

    return (
      <SearchFilter
        value={value}
        onChange={setValue}
        chips={chips}
        placeholder="Search customers"
        showPanel={false}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    value: "Locked query",
    onChange: () => undefined,
    disabled: true,
    chips: [{ id: "status", label: "Status: Active", onRemove: () => undefined }],
  },
};

export const ReadOnly: Story = {
  args: {
    value: "",
    onChange: () => undefined,
    readOnly: true,
    placeholder: "Filters & grouping",
    chips: [{ id: "group", label: "Group: Country", onRemove: () => undefined }],
  },
};
