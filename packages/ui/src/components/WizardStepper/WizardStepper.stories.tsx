import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { WizardStepper } from "./WizardStepper";

const steps = ["Customer", "Shipping", "Payment", "Review"];

const meta = {
  title: "Components/WizardStepper",
  component: WizardStepper,
  args: {
    steps,
  },
} satisfies Meta<typeof WizardStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstActive: Story = {
  args: { value: 0 },
};

export const MiddleActive: Story = {
  args: { value: 1 },
};

export const LastActive: Story = {
  args: { value: steps.length - 1 },
};

export const Clickable: Story = {
  render: (args) => {
    const [value, setValue] = useState(0);
    return <WizardStepper {...args} value={value} onChange={setValue} />;
  },
};
