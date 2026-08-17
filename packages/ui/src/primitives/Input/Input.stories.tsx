import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { FormField } from "../../components/Form/FormField";
import { FormInput } from "../../components/Form/fields/FormInput";
import { fieldMinWidthClasses } from "../../utils";

const meta = {
  title: "Primitives/Input",
  component: Input,
  args: {
    placeholder: "Enter value",
    size: "sm",
    className: fieldMinWidthClasses.sm,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "default"],
    },
    chrome: {
      control: "inline-radio",
      options: ["underline", "corner", "tick"],
    },
    chromeEdge: {
      control: "inline-radio",
      options: ["end", "start"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Single-line text field with shared ERP field chrome. Each story isolates one concern — use Form › Text Fields for labeled form layout.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Product default: size `sm`, standard field chrome. */
export const Default: Story = {};

/** Width steps at fixed height — sm / md / default. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[10px] text-erp-muted">sm</span>
        <Input size="sm" placeholder="Small width" className={fieldMinWidthClasses.sm} />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[10px] text-erp-muted">md</span>
        <Input size="md" placeholder="Medium width" className={fieldMinWidthClasses.md} />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-[10px] text-erp-muted">default</span>
        <Input
          size="default"
          placeholder="Default width"
          className={fieldMinWidthClasses.default}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Width tokens only — height stays at the sm baseline (h-9).",
      },
    },
  },
};

/** Shared field chrome: underline, corner (default), tick — plus start/end edge. */
export const Chrome: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Input
        placeholder="underline"
        chrome="underline"
        className={fieldMinWidthClasses.md}
      />
      <Input
        placeholder="corner end (default)"
        chrome="corner"
        chromeEdge="end"
        className={fieldMinWidthClasses.md}
      />
      <Input
        placeholder="corner start"
        chrome="corner"
        chromeEdge="start"
        className={fieldMinWidthClasses.md}
      />
      <Input
        placeholder="tick end"
        chrome="tick"
        chromeEdge="end"
        className={fieldMinWidthClasses.md}
      />
      <Input
        placeholder="tick start"
        chrome="tick"
        chromeEdge="start"
        className={fieldMinWidthClasses.md}
      />
      <Input
        placeholder="corner end error"
        chrome="corner"
        error
        defaultValue="invalid@"
        className={fieldMinWidthClasses.md}
      />
      <Input
        placeholder="tick end disabled"
        chrome="tick"
        disabled
        defaultValue="Locked"
        className={fieldMinWidthClasses.md}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`underline` is bottom only. `corner` is full-height end/start side. `tick` is a half-height side mark. Toggle RTL in the toolbar to flip edges.",
      },
    },
  },
};

/** Native input types supported in forms. */
export const InputTypes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Input type="text" placeholder="Company name" className={fieldMinWidthClasses.md} />
      <Input
        type="email"
        placeholder="billing@acme.com"
        className={fieldMinWidthClasses.md}
      />
      <Input type="password" placeholder="Password" className={fieldMinWidthClasses.md} />
      <Input type="number" placeholder="0.00" className={fieldMinWidthClasses.sm} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "text, email, password, and number (spinners hidden on number).",
      },
    },
  },
};

/** Populated field. */
export const WithValue: Story = {
  args: {
    placeholder: "Company",
    defaultValue: "Acme Trading LLC",
  },
};

/** Error chrome + `aria-invalid`. */
export const WithError: Story = {
  args: {
    placeholder: "Email",
    error: true,
    defaultValue: "invalid@",
  },
};

/** Non-interactive disabled state. */
export const Disabled: Story = {
  args: {
    placeholder: "Code",
    disabled: true,
    defaultValue: "Read only",
  },
};

/** Read-only value — focusable but not editable. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: "INV-2026-0042",
    className: fieldMinWidthClasses.md,
  },
};

/** Full column width as used inside form grids. */
export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <Input placeholder="Full column width" className="w-full min-w-0" />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: "Typical form usage — `w-full` inside a grid column." },
    },
  },
};

/** Label, required marker, description, and field error via FormField. */
export const WithLabel: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <FormField
        label="Reply-to email"
        htmlFor="reply-to-demo"
        description="Used on outbound customer emails."
        required={true}
        error="Enter a valid email address."
      >
        <FormInput
          id="reply-to-demo"
          name="replyTo"
          type="email"
          error={true}
          defaultValue="invalid@"
        />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Form layout only — FormField + FormInput wrapper for full-width form columns.",
      },
    },
  },
};
