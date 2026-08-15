import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, useToast } from "./Toast";
import { Button } from "../../primitives/Button";

function ToastTriggers() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        onClick={() =>
          toast({ title: "Saved", description: "Customer updated.", variant: "success" })
        }
      >
        Success
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          toast({ title: "Failed", description: "Could not delete.", variant: "error" })
        }
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({ title: "Heads up", description: "Sync in progress.", variant: "warning" })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => toast({ title: "Info", description: "New version available.", variant: "info" })}
      >
        Info
      </Button>
    </div>
  );
}

const meta = {
  title: "Composites/Toast",
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => <ToastTriggers />,
};
