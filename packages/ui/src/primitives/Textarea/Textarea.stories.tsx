import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { FormField } from "../../components/Form/FormField";
import { FormTextarea } from "../../components/Form/fields/FormTextarea";
import { fieldMinWidthClasses } from "../../utils";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  args: {
    placeholder: "Description",
    size: "sm",
    className: fieldMinWidthClasses.sm,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "default"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Multi-line text field with shared ERP field chrome. Each story isolates one concern.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Product default: size `sm`, single row baseline. */
export const Default: Story = {};

/** Width steps at fixed single-row height. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-start gap-2">
        <span className="w-14 shrink-0 pt-2 text-[10px] text-erp-muted">sm</span>
        <Textarea
          size="sm"
          placeholder="Small width"
          className={fieldMinWidthClasses.sm}
        />
      </div>
      <div className="flex items-start gap-2">
        <span className="w-14 shrink-0 pt-2 text-[10px] text-erp-muted">md</span>
        <Textarea
          size="md"
          placeholder="Medium width"
          className={fieldMinWidthClasses.md}
        />
      </div>
      <div className="flex items-start gap-2">
        <span className="w-14 shrink-0 pt-2 text-[10px] text-erp-muted">default</span>
        <Textarea
          size="default"
          placeholder="Default width"
          className={fieldMinWidthClasses.default}
        />
      </div>
    </div>
  ),
};

/** Explicit row count and vertical resize. */
export const MultiLine: Story = {
  args: {
    rows: 4,
    placeholder: "Notes for the sales team…",
    className: fieldMinWidthClasses.default,
  },
  parameters: {
    docs: {
      description: { story: "`rows={4}` with `resize-y` for longer free text." },
    },
  },
};

/** Populated field. */
export const WithValue: Story = {
  args: {
    defaultValue: "Customer prefers email follow-up.",
    className: fieldMinWidthClasses.md,
  },
};

/** Error chrome + `aria-invalid`. */
export const WithError: Story = {
  args: {
    error: true,
    placeholder: "Notes",
    className: fieldMinWidthClasses.md,
  },
};

/** Non-interactive disabled state. */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Locked",
    className: fieldMinWidthClasses.md,
  },
};

/** Read-only value — focusable but not editable. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: "Approved by finance on 12 Jun 2026.",
    rows: 3,
    className: fieldMinWidthClasses.default,
  },
};

/** Full column width as used inside form grids. */
export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <Textarea placeholder="Full column width" rows={3} className="w-full min-w-0" />
    </div>
  ),
};

/** Label, description, and field error via FormField. */
export const WithLabel: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <FormField
        label="Internal notes"
        htmlFor="notes-demo"
        description="Not visible to the customer."
        error="Notes are required before saving."
      >
        <FormTextarea
          id="notes-demo"
          name="notes"
          error={true}
          rows={3}
          placeholder="Notes"
        />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Form layout only — FormField + FormTextarea in a grid column.",
      },
    },
  },
};
