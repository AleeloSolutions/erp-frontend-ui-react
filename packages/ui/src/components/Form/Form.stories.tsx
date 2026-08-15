import type { Meta, StoryObj } from "@storybook/react";
import { FormShell } from "./FormShell";
import { FormSection } from "./FormSection";
import { FormGrid } from "./FormGrid";
import { FormField } from "./FormField";
import { FormInput } from "./fields/FormInput";
import { FormSelect } from "./fields/FormSelect";
import { FormTextarea } from "./fields/FormTextarea";

const meta = {
  title: "Composites/Form",
  component: FormShell,
} satisfies Meta<typeof FormShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateCustomer: Story = {
  render: () => (
    <FormShell
      title="New customer"
      description="Capture basic account details."
      actionProps={{
        onCancel: () => undefined,
        submitLabel: "Create",
      }}
      onSubmit={(event) => event.preventDefault()}
    >
      <FormSection title="Profile">
        <FormGrid>
          <FormField label="Name" htmlFor="name" required>
            <FormInput id="name" name="name" placeholder="Acme Trading" />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <FormSelect
              id="status"
              name="status"
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </FormField>
          <FormField label="Notes" htmlFor="notes" span={12}>
            <FormTextarea id="notes" name="notes" rows={3} />
          </FormField>
        </FormGrid>
      </FormSection>
    </FormShell>
  ),
};

export const WithServerError: Story = {
  render: () => (
    <FormShell
      title="New customer"
      serverError="Email is already registered."
      actionProps={{ submitLabel: "Retry" }}
      onSubmit={(event) => event.preventDefault()}
    >
      <FormSection title="Profile">
        <FormGrid>
          <FormField label="Email" htmlFor="email" error="Must be unique" required>
            <FormInput id="email" name="email" type="email" error />
          </FormField>
        </FormGrid>
      </FormSection>
    </FormShell>
  ),
};
