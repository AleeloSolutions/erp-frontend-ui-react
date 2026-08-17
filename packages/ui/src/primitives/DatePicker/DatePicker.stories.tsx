import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker } from "./DatePicker";

const meta = {
  title: "Primitives/DatePicker",
  component: DatePicker,
  args: {
    placeholder: "Select date",
    size: "sm",
    className: "w-48",
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
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "2026-08-15",
  },
};

export const Clearable: Story = {
  args: {
    defaultValue: "2026-08-15",
    clearable: true,
  },
};

export const WithMinMax: Story = {
  args: {
    defaultValue: "2026-08-15",
    min: "2026-08-01",
    max: "2026-08-31",
    clearable: true,
  },
};

export const DisabledDates: Story = {
  args: {
    defaultValue: "2026-08-15",
    disabledDates: (date) => date.getDay() === 0 || date.getDay() === 6,
    placeholder: "Weekdays only",
  },
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState("2026-08-15");
    return (
      <div className="flex max-w-xs flex-col gap-2">
        <DatePicker
          value={value}
          clearable
          onChange={(event) => setValue(event.target.value)}
        />
        <p className="m-0 text-[11px] text-erp-muted">Value: {value || "(empty)"}</p>
      </div>
    );
  },
};

export const ErrorState: Story = {
  args: {
    defaultValue: "2026-08-15",
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: "2026-08-15",
    disabled: true,
  },
};

export const Chrome: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <DatePicker placeholder="underline" chrome="underline" className="w-64" />
      <DatePicker
        placeholder="corner end"
        chrome="corner"
        chromeEdge="end"
        className="w-64"
      />
      <DatePicker
        placeholder="corner start"
        chrome="corner"
        chromeEdge="start"
        className="w-64"
      />
      <DatePicker
        placeholder="tick end"
        chrome="tick"
        chromeEdge="end"
        className="w-64"
      />
      <DatePicker
        placeholder="tick start"
        chrome="tick"
        chromeEdge="start"
        className="w-64"
      />
    </div>
  ),
};

export const LocaleDisplay: Story = {
  args: {
    defaultValue: "2026-08-15",
    locale: "ar",
    displayStyle: "long",
    clearable: true,
  },
};
