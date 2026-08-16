import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FormShell } from "./FormShell";
import { FormSection } from "./FormSection";
import { FormGrid } from "./FormGrid";
import { FormField } from "./FormField";
import { FormStepper } from "./FormStepper";
import { FormSummary } from "./FormSummary";
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
  render: function CreateCustomerStory() {
    const [status, setStatus] = useState("idle");

    return (
      <div className="flex flex-col gap-2">
        <FormShell
          title="New customer"
          description="Capture basic account details."
          actionProps={{
            onCancel: () => setStatus("cancelled"),
            submitLabel: "Create",
          }}
          onSubmit={(event) => {
            event.preventDefault();
            setStatus("submitted");
          }}
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
                <FormTextarea id="notes" name="notes" />
              </FormField>
            </FormGrid>
          </FormSection>
        </FormShell>
        <p className="m-0 text-[11px] text-erp-muted" aria-live="polite">
          Form status: {status}
        </p>
      </div>
    );
  },
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

export const Submitting: Story = {
  render: function SubmittingStory() {
    const [submitting, setSubmitting] = useState(false);

    return (
      <FormShell
        title="New customer"
        description="Submit shows the loading action state."
        actionProps={{
          submitLabel: "Create",
          submitting,
        }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitting(true);
          window.setTimeout(() => setSubmitting(false), 1500);
        }}
      >
        <FormSection title="Profile">
          <FormGrid>
            <FormField label="Name" htmlFor="submitting-name" required>
              <FormInput id="submitting-name" name="name" defaultValue="Acme Trading" />
            </FormField>
          </FormGrid>
        </FormSection>
      </FormShell>
    );
  },
};

export const WithStepperAndSummary: Story = {
  name: "Stepper + summary",
  render: function StepperSummaryStory() {
    const [step, setStep] = useState(1);
    const [status, setStatus] = useState("idle");

    return (
      <div className="flex flex-col gap-2">
        <FormShell
          title="New invoice"
          description="Multi-step shell with summary rail."
          stepper={
            <FormStepper steps={["Details", "Lines", "Review"]} currentStep={step} />
          }
          summary={
            <FormSummary
              title="Totals"
              items={[
                { key: "subtotal", label: "Subtotal", value: "$1,200.00" },
                { key: "tax", label: "Tax", value: "$60.00" },
                { key: "total", label: "Total", value: "$1,260.00", emphasize: true },
              ]}
            />
          }
          actionProps={{
            onSecondary: () => {
              setStep((current) => Math.max(0, current - 1));
              setStatus("back");
            },
            secondaryLabel: "Back",
            submitLabel: "Continue",
          }}
          onSubmit={(event) => {
            event.preventDefault();
            setStep((current) => Math.min(2, current + 1));
            setStatus("continued");
          }}
        >
          <FormSection title="Line items">
            <FormGrid>
              <FormField label="Item" htmlFor="item" required>
                <FormInput id="item" name="item" defaultValue="Consulting" />
              </FormField>
              <FormField label="Amount" htmlFor="amount" required>
                <FormInput id="amount" name="amount" defaultValue="1200" />
              </FormField>
            </FormGrid>
          </FormSection>
        </FormShell>
        <p className="m-0 text-[11px] text-erp-muted" aria-live="polite">
          Step {step + 1} · {status}
        </p>
      </div>
    );
  },
};

export const FieldDescription: Story = {
  name: "Field description",
  render: () => (
    <FormShell
      title="Preferences"
      actionProps={{ submitLabel: "Save" }}
      onSubmit={(event) => event.preventDefault()}
    >
      <FormSection title="Contact">
        <FormGrid>
          <FormField
            label="Reply-to"
            htmlFor="reply-to"
            description="Used on outbound customer emails."
          >
            <FormInput
              id="reply-to"
              name="replyTo"
              type="email"
              placeholder="billing@acme.com"
            />
          </FormField>
        </FormGrid>
      </FormSection>
    </FormShell>
  ),
};
