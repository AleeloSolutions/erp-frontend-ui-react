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
  loading?: boolean;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(props.initiallyOpen ?? false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    if (!props.loading) {
      setOpen(false);
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 1200);
  };

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
        loading={props.loading ? loading : false}
        onCancel={() => {
          if (loading) return;
          setOpen(false);
        }}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export const OpenFlow: Story = {
  name: "Open flow",
  render: () => <ConfirmDemo variant="danger" />,
};

export const Danger: Story = {
  render: () => <ConfirmDemo variant="danger" initiallyOpen />,
};

export const Default: Story = {
  render: () => <ConfirmDemo variant="primary" title="Confirm action?" initiallyOpen />,
};

export const Teal: Story = {
  render: () => <ConfirmDemo variant="teal" title="Publish changes?" initiallyOpen />,
};

export const Loading: Story = {
  render: () => <ConfirmDemo variant="danger" loading initiallyOpen />,
};
