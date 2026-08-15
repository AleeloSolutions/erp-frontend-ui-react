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

function DrawerDemo({ side }: { side?: "left" | "right" }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Customer detail"
        description="Read-only quick view"
        side={side}
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

export const Right: Story = {
  render: () => <DrawerDemo side="right" />,
};

export const Left: Story = {
  render: () => <DrawerDemo side="left" />,
};
