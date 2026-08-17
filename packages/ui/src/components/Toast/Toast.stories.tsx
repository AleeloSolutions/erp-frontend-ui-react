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
          toast({
            title: "Heads up",
            description: "Sync in progress.",
            variant: "warning",
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: "Info", description: "New version available.", variant: "info" })
        }
      >
        Info
      </Button>
    </div>
  );
}

function TitleOnlyTrigger() {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => toast({ title: "Copied to clipboard", variant: "success" })}
    >
      Title only
    </Button>
  );
}

function PersistentTrigger() {
  const { toast } = useToast();
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast({
          title: "Pinned notice",
          description: "Stays until dismissed (duration: 0).",
          variant: "info",
          duration: 0,
        })
      }
    >
      Persistent
    </Button>
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

export const TitleOnly: Story = {
  name: "Title only",
  render: () => <TitleOnlyTrigger />,
};

export const Persistent: Story = {
  render: () => <PersistentTrigger />,
};
