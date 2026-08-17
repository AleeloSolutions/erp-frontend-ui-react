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

export const KeyboardFocus: Story = {
  name: "Keyboard focus",
  render: () => (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-[11px] text-erp-muted">
        Tab to the button — tooltip uses focus/blur and sets <code>aria-describedby</code>{" "}
        while visible.
      </p>
      <Tooltip content="Shown on focus and hover" side="top">
        <Button variant="secondary">Focus me</Button>
      </Tooltip>
    </div>
  ),
};
