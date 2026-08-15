import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "../../primitives/Button";

const meta = {
  title: "Composites/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    open: true,
    title: "Delete record?",
    description: "This action cannot be undone.",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function ConfirmDemo(props: {
  variant?: "primary" | "danger" | "teal";
  title?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <ConfirmDialog
        open={open}
        title={props.title ?? "Delete record?"}
        description="This action cannot be undone."
        variant={props.variant ?? "danger"}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

export const Danger: Story = {
  render: () => <ConfirmDemo variant="danger" />,
};

export const Default: Story = {
  render: () => <ConfirmDemo variant="primary" title="Confirm action?" />,
};
