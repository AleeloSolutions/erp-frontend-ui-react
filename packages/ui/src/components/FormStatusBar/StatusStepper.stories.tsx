import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StatusStepper, type StatusStep } from "./StatusStepper";

const inviteSteps: StatusStep[] = [
  { key: "invited", label: "Invited" },
  { key: "confirmed", label: "Confirmed" },
];

const invoiceSteps: StatusStep[] = [
  { key: "draft", label: "Draft" },
  { key: "posted", label: "Posted" },
  { key: "paid", label: "Paid" },
];

const meta = {
  title: "Components/StatusStepper",
  component: StatusStepper,
  args: {
    steps: invoiceSteps,
    currentStepKey: "posted",
  },
} satisfies Meta<typeof StatusStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Usable on its own, not only inside `FormStatusBar`. */
export const Default: Story = {};

/**
 * Without `onStepChange` the segments are inert: the record's own state
 * decides the step, and nothing here can claim otherwise. This is the
 * shape Settings → user form uses for Invited → Confirmed, which only
 * moves when the person actually signs in.
 */
export const DisplayOnly: Story = {
  args: {
    steps: inviteSteps,
    currentStepKey: "invited",
    "aria-label": "Invite status",
  },
};

export const LastStepActive: Story = {
  args: { steps: inviteSteps, currentStepKey: "confirmed" },
};

/** Passing `onStepChange` makes the steps selectable — for states a user
 * is genuinely allowed to move between. */
export const Interactive: Story = {
  render: function Interactive(args) {
    const [currentStepKey, setCurrentStepKey] = useState(args.currentStepKey);
    return (
      <StatusStepper
        {...args}
        currentStepKey={currentStepKey}
        onStepChange={setCurrentStepKey}
      />
    );
  },
};

/** A lone step gets no chevron cut at all. */
export const SingleStep: Story = {
  args: { steps: [{ key: "done", label: "Done" }], currentStepKey: "done" },
};

/** Labels of very different lengths still meet flush: each segment's
 * geometry is computed from its own measured width. */
export const UnevenLabels: Story = {
  args: {
    steps: [
      { key: "new", label: "New" },
      { key: "waiting", label: "Waiting for confirmation" },
      { key: "ok", label: "Done" },
    ],
    currentStepKey: "waiting",
  },
};
