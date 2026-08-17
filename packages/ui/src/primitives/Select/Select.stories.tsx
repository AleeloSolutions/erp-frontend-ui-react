import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";
import { fieldMinWidthClasses } from "../../utils";

const options = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending", value: "pending", disabled: true },
];

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
  args: {
    options,
    placeholder: "Select status",
    size: "sm",
    className: fieldMinWidthClasses.sm,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "default"],
    },
    chrome: {
      control: "inline-radio",
      options: ["underline", "corner", "tick"],
    },
    chromeEdge: {
      control: "inline-radio",
      options: ["end", "start"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "active",
  },
};

export const WithError: Story = {
  args: {
    error: true,
    placeholder: "Choose a status",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "active",
  },
};

export const PlaceholderOnly: Story = {
  args: {
    placeholder: "Category",
    defaultValue: "",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[10px] text-erp-muted">sm</span>
        <Select
          size="sm"
          options={options}
          placeholder="Small width"
          className={fieldMinWidthClasses.sm}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[10px] text-erp-muted">md</span>
        <Select
          size="md"
          options={options}
          placeholder="Medium width"
          className={fieldMinWidthClasses.md}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[10px] text-erp-muted">default</span>
        <Select
          size="default"
          options={options}
          placeholder="Default width"
          className={fieldMinWidthClasses.default}
        />
      </div>
    </div>
  ),
};

export const Chrome: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Select
        options={options}
        placeholder="underline"
        chrome="underline"
        className={fieldMinWidthClasses.md}
      />
      <Select
        options={options}
        placeholder="corner end"
        chrome="corner"
        chromeEdge="end"
        className={fieldMinWidthClasses.md}
      />
      <Select
        options={options}
        placeholder="corner start"
        chrome="corner"
        chromeEdge="start"
        className={fieldMinWidthClasses.md}
      />
      <Select
        options={options}
        placeholder="tick end"
        chrome="tick"
        chromeEdge="end"
        className={fieldMinWidthClasses.md}
      />
      <Select
        options={options}
        placeholder="tick start"
        chrome="tick"
        chromeEdge="start"
        className={fieldMinWidthClasses.md}
      />
    </div>
  ),
};
