import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dropdown } from "./Dropdown";

const meta = {
  title: "Composites/Dropdown",
  component: Dropdown,
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

function DropdownDemo({
  align,
  withDisabled,
}: {
  align?: "left" | "right";
  withDisabled?: boolean;
}) {
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <Dropdown
        label="Actions"
        align={align}
        className="w-48"
        items={[
          { key: "edit", label: "Edit", onClick: () => setLastAction("Edit") },
          {
            key: "duplicate",
            label: "Duplicate",
            onClick: () => setLastAction("Duplicate"),
            disabled: withDisabled,
          },
          {
            key: "archive",
            label: "Archive",
            disabled: withDisabled,
            onClick: () => setLastAction("Archive"),
          },
          {
            key: "delete",
            label: "Delete",
            danger: true,
            onClick: () => setLastAction("Delete"),
          },
        ]}
      />
      <p className="m-0 text-[11px] text-erp-muted" aria-live="polite">
        Last action: {lastAction ?? "none"}
      </p>
    </div>
  );
}

export const Default: Story = {
  render: () => <DropdownDemo />,
};

export const AlignRight: Story = {
  render: () => <DropdownDemo align="right" />,
};

export const WithDisabledItem: Story = {
  name: "Danger + disabled items",
  render: () => <DropdownDemo withDisabled />,
};

export const FieldChrome: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Dropdown
        trigger="field"
        label="underline"
        chrome="underline"
        className="w-64"
        items={[{ key: "a", label: "Option A" }]}
      />
      <Dropdown
        trigger="field"
        label="corner end"
        chrome="corner"
        chromeEdge="end"
        className="w-64"
        items={[{ key: "a", label: "Option A" }]}
      />
      <Dropdown
        trigger="field"
        label="corner start"
        chrome="corner"
        chromeEdge="start"
        className="w-64"
        items={[{ key: "a", label: "Option A" }]}
      />
      <Dropdown
        trigger="field"
        label="tick end"
        chrome="tick"
        chromeEdge="end"
        className="w-64"
        items={[{ key: "a", label: "Option A" }]}
      />
      <Dropdown
        trigger="field"
        label="tick start"
        chrome="tick"
        chromeEdge="start"
        className="w-64"
        items={[{ key: "a", label: "Option A" }]}
      />
    </div>
  ),
};

const partners = [
  { key: "1", label: "ABDIFATAH MOAHMED" },
  { key: "2", label: "AK" },
  { key: "3", label: "AZIZ DAHIR" },
  { key: "4", label: "MOHAMED" },
  { key: "5", label: "DANIA" },
];

export const FieldSelect: Story = {
  name: "Field select (no search)",
  render: function FieldSelectStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <div className="min-h-48 w-64">
        <Dropdown
          trigger="field"
          placeholder="Select a customer"
          value={value}
          onChange={(next) => setValue(next)}
          items={partners}
        />
      </div>
    );
  },
};

export const FieldSearch: Story = {
  name: "Field search",
  render: function FieldSearchStory() {
    const [value, setValue] = useState<string | null>(null);
    const [opened, setOpened] = useState(false);
    return (
      <div className="min-h-64 w-64 space-y-2">
        <Dropdown
          trigger="field"
          searchable
          placeholder="Search a name or Tax ID..."
          value={value}
          onChange={(next) => setValue(next)}
          onSearchMore={() => setOpened(true)}
          items={partners}
        />
        {opened ? (
          <p className="m-0 text-[12px] text-erp-muted">Search more was chosen.</p>
        ) : null}
      </div>
    );
  },
};
