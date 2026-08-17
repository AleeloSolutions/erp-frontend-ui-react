import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../../primitives/Button";

const meta = {
  title: "Composites/Modal",
  component: Modal,
  args: {
    open: true,
    title: "Edit customer",
    description: "Update contact details.",
    onClose: () => undefined,
    children: <p className="m-0 text-[12px] text-erp-muted">Modal body content.</p>,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

function ModalDemo({
  size,
  initiallyOpen = false,
}: {
  size?: "sm" | "md" | "lg";
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit customer"
        description="Update contact details. Escape or overlay closes the dialog."
        size={size}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Save
            </Button>
          </>
        }
      >
        <p className="m-0 text-[12px] text-erp-muted">Modal body content goes here.</p>
      </Modal>
    </>
  );
}

export const OpenFlow: Story = {
  name: "Open flow",
  render: () => <ModalDemo size="md" />,
};

export const Small: Story = {
  render: () => <ModalDemo size="sm" initiallyOpen />,
};

export const Medium: Story = {
  render: () => <ModalDemo size="md" initiallyOpen />,
};

export const Large: Story = {
  render: () => <ModalDemo size="lg" initiallyOpen />,
};
