import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./FormField";
import { FormGrid } from "./FormGrid";
import { FormInput } from "./fields/FormInput";

const meta = {
  title: "Composites/FormField",
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          "Odoo-style form label (`o_form_label`): 0.6875rem normal weight, `#111827`, wraps on long text.",
      },
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <FormGrid className="max-w-md">
      <FormField label="Job Position" htmlFor="job-position">
        <FormInput id="job-position" name="jobPosition" />
      </FormField>
    </FormGrid>
  ),
};

export const Required: Story = {
  render: () => (
    <FormGrid className="max-w-md">
      <FormField label="Customer" htmlFor="customer" required>
        <FormInput id="customer" name="customer" />
      </FormField>
    </FormGrid>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <FormGrid className="max-w-md">
      <FormField
        label="Reply-to"
        htmlFor="reply-to"
        description="Used on outbound customer emails."
      >
        <FormInput id="reply-to" name="replyTo" type="email" />
      </FormField>
    </FormGrid>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormGrid className="max-w-md">
      <FormField label="Email" htmlFor="email" required error="Must be unique">
        <FormInput id="email" name="email" type="email" error />
      </FormField>
    </FormGrid>
  ),
};

export const NoLabel: Story = {
  render: () => (
    <FormGrid className="max-w-md">
      <FormField htmlFor="notes">
        <FormInput id="notes" name="notes" placeholder="Optional notes" />
      </FormField>
    </FormGrid>
  ),
};

export const TwoColumn: Story = {
  render: () => (
    <FormGrid className="max-w-2xl">
      <FormField label="Date" htmlFor="date" required span={6}>
        <FormInput id="date" name="date" />
      </FormField>
      <FormField label="Valid until" htmlFor="valid-until" required span={6}>
        <FormInput id="valid-until" name="validUntil" />
      </FormField>
    </FormGrid>
  ),
};
