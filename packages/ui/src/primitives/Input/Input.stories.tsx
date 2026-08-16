import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { fieldMinWidthClasses } from "../../utils";

const meta: Meta<typeof Input> = {
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
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

/** Product default = size `sm` (h-9 / text-xs) at sm width. */
export const Default: Story = {};

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
};

export const WithValue: Story = {
  args: {
    placeholder: "Company",
    defaultValue: "Acme Trading LLC",
  },
};

export const WithError: Story = {
  args: {
    placeholder: "Email",
    error: true,
    defaultValue: "invalid@",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Code",
    disabled: true,
    defaultValue: "Read only",
  },
};
