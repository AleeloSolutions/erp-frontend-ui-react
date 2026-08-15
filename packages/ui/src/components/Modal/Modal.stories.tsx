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

function ModalDemo({ size }: { size?: "sm" | "md" | "lg" }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit customer"
        description="Update contact details."
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

export const Medium: Story = {
  render: () => <ModalDemo size="md" />,
};

export const Large: Story = {
  render: () => <ModalDemo size="lg" />,
};
