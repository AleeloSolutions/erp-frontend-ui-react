import type { Meta, StoryObj } from "@storybook/react";
import { FormStatusBar, type FormStatusBarAction } from "./FormStatusBar";
import type { StatusStep } from "./StatusStepper";

const invoiceSteps: StatusStep[] = [
  { key: "draft", label: "Draft" },
  { key: "posted", label: "Posted" },
];

const invoiceActions: FormStatusBarAction[] = [
  { key: "confirm", label: "Confirm", variant: "primary" },
  { key: "cancel", label: "Cancel", variant: "secondary" },
];

const meta = {
  title: "Components/FormStatusBar",
  component: FormStatusBar,
  args: {
    actions: invoiceActions,
    steps: invoiceSteps,
    currentStepKey: "draft",
  },
} satisfies Meta<typeof FormStatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Posted: Story = {
  args: {
    actions: [{ key: "cancel", label: "Reset to Draft", variant: "secondary" }],
    currentStepKey: "posted",
  },
};

export const SingleAction: Story = {
  args: {
    actions: [{ key: "confirm", label: "Confirm", variant: "primary" }],
  },
};

export const NoActions: Story = {
  args: {
    actions: [],
  },
};

export const LongerSequence: Story = {
  args: {
    actions: [{ key: "next", label: "Next Stage", variant: "primary" }],
    steps: [
      { key: "quotation", label: "Quotation" },
      { key: "sales_order", label: "Sales Order" },
      { key: "done", label: "Locked" },
    ],
    currentStepKey: "sales_order",
  },
};

export const RTL: Story = {
  args: {
    actions: invoiceActions,
  },
  render: (args) => (
    <div dir="rtl">
      <FormStatusBar {...args} />
    </div>
  ),
};
