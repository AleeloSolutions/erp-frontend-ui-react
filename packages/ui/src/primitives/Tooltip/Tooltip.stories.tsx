import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./Tooltip";
import { Button } from "../Button";

const meta: Meta<typeof Tooltip> = {
  title: "Primitives/Tooltip",
  component: Tooltip,
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Top: Story = {
  render: () => (
    <Tooltip content="More information" side="top">
      <Button variant="secondary">Hover me</Button>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Tooltip content="More information" side="bottom">
      <Button variant="secondary">Hover me</Button>
    </Tooltip>
  ),
};
