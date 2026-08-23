import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FormStatusBar, type FormStatusBarAction } from "./FormStatusBar";
import type { StatusStep } from "./StatusStepper";

const wizardSteps: StatusStep[] = [
  { key: "quotation", label: "Quotation" },
  { key: "done", label: "Locked" },
];

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

export const Interactive: Story = {
  args: {
    steps: wizardSteps,
    currentStepKey: "quotation",
  },
  render: function Interactive(args) {
    const [currentStepKey, setCurrentStepKey] = useState(args.currentStepKey);
    return (
      <FormStatusBar {...args} currentStepKey={currentStepKey} onStepChange={setCurrentStepKey} />
    );
  },
};

export const NoActions: Story = {
  args: {
    actions: [],
  },
};

export const SingleAction: Story = {
  args: {
    actions: [{ key: "confirm", label: "Confirm", variant: "primary" }],
  },
};
