import type { Meta, StoryObj } from "@storybook/react";
import { AlignJustify, Plus, Trash2 } from "lucide-react";
import { Button } from "./Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: {
    children: "Save",
    variant: "secondary",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "teal", "danger", "ghost", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Primary actions, form submits, and toolbar controls. Each story isolates one concern.",
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Product default: secondary, medium. */
export const Default: Story = {};

/** All semantic variants side by side. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="teal">Teal</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Variant palette only — use semantic tokens, not one-off colors.",
      },
    },
  },
};

/** Height and density steps. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" size="sm">
        Small
      </Button>
      <Button variant="primary" size="md">
        Medium
      </Button>
      <Button variant="primary" size="lg">
        Large
      </Button>
    </div>
  ),
};

/** Icon-only triggers for toolbars and row actions. */
export const IconButtons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" size="icon" aria-label="Create">
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <Button variant="secondary" size="icon" aria-label="Columns" className="h-9 w-9">
        <AlignJustify className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Delete row">
        <Trash2 className="h-3.5 w-3.5 text-erp-error" aria-hidden />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Icon-only buttons for page headers, DataTable row actions, and column menus.",
      },
    },
  },
};

/** Standard form footer: dismiss + submit. */
export const FormActionPair: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Typical FormShell footer — secondary dismiss + primary submit.",
      },
    },
  },
};

/** Destructive confirmation footer. */
export const DangerConfirm: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary">Cancel</Button>
      <Button variant="danger">Delete</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "ConfirmDialog / destructive flows — never primary for delete.",
      },
    },
  },
};

/** Compact controls aligned with list-page meta strip height. */
export const ToolbarRow: Story = {
  render: () => (
    <div className="flex items-center gap-2 rounded-lg border border-erp-border bg-white px-3 py-1.5">
      <Button variant="primary" size="sm">
        Create
      </Button>
      <Button variant="secondary" size="icon" aria-label="Columns" className="h-9 w-9">
        <AlignJustify className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Page header / list toolbar density — pairs with SearchFilter strip.",
      },
    },
  },
};

/** Spinner replaces label; button is disabled while loading. */
export const Loading: Story = {
  args: { variant: "primary", loading: true, children: "Saving" },
};

/** Disabled — no pointer events. */
export const Disabled: Story = {
  args: { variant: "primary", disabled: true, children: "Save" },
};
