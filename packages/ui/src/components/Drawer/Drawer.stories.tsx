import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Drawer } from "./Drawer";
import { Button } from "../../primitives/Button";

const meta = {
  title: "Composites/Drawer",
  component: Drawer,
  args: {
    open: true,
    title: "Customer detail",
    onClose: () => undefined,
    children: <p className="m-0 text-[12px]">Quick view content.</p>,
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function DrawerDemo({
  side,
  size,
  initiallyOpen = false,
}: {
  side?: "left" | "right";
  size?: "sm" | "md" | "lg";
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Customer detail"
        description="Read-only quick view. Escape closes the panel."
        side={side}
        size={size}
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-2 text-[12px] text-erp-text">
          <p className="m-0">
            <strong>Name:</strong> Acme Trading
          </p>
          <p className="m-0">
            <strong>Status:</strong> Active
          </p>
        </div>
      </Drawer>
    </>
  );
}

export const OpenFlow: Story = {
  name: "Open flow",
  render: () => <DrawerDemo side="right" />,
};

export const Right: Story = {
  render: () => <DrawerDemo side="right" initiallyOpen />,
};

export const Left: Story = {
  render: () => <DrawerDemo side="left" initiallyOpen />,
};

export const Small: Story = {
  render: () => <DrawerDemo side="right" size="sm" initiallyOpen />,
};

export const Large: Story = {
  render: () => <DrawerDemo side="right" size="lg" initiallyOpen />,
};
