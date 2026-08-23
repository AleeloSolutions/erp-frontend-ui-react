import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@erp/ui";
import {
  FormActions,
  FormCheckbox,
  FormDatePicker,
  FormField,
  FormFileUpload,
  FormGrid,
  FormInput,
  FormRadio,
  FormSection,
  FormSelect,
  FormShell,
  FormStepper,
  FormSummary,
  FormSwitch,
  FormTextarea,
} from "@erp/ui";

function DemoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-3">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="m-0 mt-0.5 text-[11px] text-erp-subtle">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phone: z.string().min(7, "Phone number is required"),
  status: z.enum(["Active", "Inactive"], {
    message: "Status is required",
  }),
  customerType: z.enum(["Individual", "Company"], {
    message: "Customer type is required",
  }),
  address: z.string().min(1, "Address is required"),
  notes: z.string().optional(),
  newsletter: z.boolean().optional(),
  vip: z.boolean().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const invoiceSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.string().min(1, "Currency is required"),
  status: z.string().min(1, "Status is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "Amount must be a positive number",
    }),
  notes: z.string().optional(),
  attachmentName: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

function CustomerFormDemo() {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: "Active",
      customerType: "Company",
      address: "",
      notes: "",
      newsletter: true,
      vip: false,
    },
  });

  const values = watch();

  const summaryItems = useMemo(
    () => [
      { key: "type", label: "Record type", value: "Customer" },
      { key: "module", label: "Module", value: "Sales" },
      { key: "status", label: "Status", value: values.status || "—" },
      {
        key: "name",
        label: "Customer",
        value: values.name || "—",
        emphasize: true,
      },
    ],
    [values.name, values.status]
  );

  async function onSubmit(data: CustomerFormValues) {
    setServerError(null);
    setSubmitting(true);
    setStep(1);
    await new Promise((resolve) => window.setTimeout(resolve, 900));

    if (data.email.toLowerCase().includes("fail")) {
      setSubmitting(false);
      setStep(0);
      setServerError("Server rejected this customer. Try a different email.");
      return;
    }

    setSubmitting(false);
    setStep(2);
    setSubmitted(true);
  }

  return (
    <>
      <DemoSection
        title="Form — Create Customer"
        description="Validation, required fields, responsive grid, sections, summary, and submit state."
      >
        <div className="p-3 pt-0">
          {submitted ? (
            <p className="mb-2 rounded-md border border-erp-success/20 bg-erp-success-bg px-2.5 py-2 text-[11px] text-erp-success">
              Customer draft submitted successfully (mock).
            </p>
          ) : null}
          <FormStepper
            steps={["Basic Information", "Details", "Review"]}
            currentStep={step}
            className="mb-2"
          />
          <FormShell
            serverError={serverError}
            onSubmit={handleSubmit(onSubmit)}
            summary={
              <FormSummary
                items={summaryItems}
                footer={
                  <>
                    1. Save draft
                    <br />
                    2. Review and submit
                    <br />
                    3. Confirmation
                  </>
                }
              />
            }
            className="rounded-md"
          >
            <FormSection
              title="Basic Information"
              description="Enter the primary customer details."
            >
              <FormGrid>
                <FormField
                  label="Customer name"
                  required
                  htmlFor="customer-name"
                  error={errors.name?.message}
                  span={6}
                >
                  <FormInput
                    id="customer-name"
                    placeholder="Customer name"
                    error={Boolean(errors.name)}
                    {...register("name")}
                  />
                </FormField>
                <FormField
                  label="Email"
                  required
                  htmlFor="customer-email"
                  error={errors.email?.message}
                  description='Tip: use an email containing "fail" to demo server error.'
                  span={6}
                >
                  <FormInput
                    id="customer-email"
                    type="email"
                    placeholder="name@example.com"
                    error={Boolean(errors.email)}
                    {...register("email")}
                  />
                </FormField>
                <FormField
                  label="Phone"
                  required
                  htmlFor="customer-phone"
                  error={errors.phone?.message}
                  span={4}
                >
                  <FormInput
                    id="customer-phone"
                    placeholder="615100000"
                    error={Boolean(errors.phone)}
                    {...register("phone")}
                  />
                </FormField>
                <FormField
                  label="Status"
                  required
                  htmlFor="customer-status"
                  error={errors.status?.message}
                  span={4}
                >
                  <FormSelect
                    id="customer-status"
                    error={Boolean(errors.status)}
                    options={[
                      { label: "Active", value: "Active" },
                      { label: "Inactive", value: "Inactive" },
                    ]}
                    {...register("status")}
                  />
                </FormField>
                <FormField
                  label="Customer type"
                  required
                  error={errors.customerType?.message}
                  span={4}
                >
                  <div className="flex h-[30px] items-center gap-3">
                    <FormRadio
                      id="type-company"
                      value="Company"
                      label="Company"
                      {...register("customerType")}
                    />
                    <FormRadio
                      id="type-individual"
                      value="Individual"
                      label="Individual"
                      {...register("customerType")}
                    />
                  </div>
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Additional information">
              <FormGrid>
                <FormField
                  label="Address"
                  required
                  htmlFor="customer-address"
                  error={errors.address?.message}
                  span={12}
                >
                  <FormInput
                    id="customer-address"
                    placeholder="Street, city, country"
                    error={Boolean(errors.address)}
                    {...register("address")}
                  />
                </FormField>
                <FormField
                  label="Notes"
                  htmlFor="customer-notes"
                  error={errors.notes?.message}
                  span={12}
                >
                  <FormTextarea
                    id="customer-notes"
                    placeholder="Optional notes"
                    error={Boolean(errors.notes)}
                    {...register("notes")}
                  />
                </FormField>
                <FormField span={6}>
                  <FormCheckbox
                    id="customer-newsletter"
                    label="Subscribe to announcements"
                    {...register("newsletter")}
                  />
                </FormField>
                <FormField span={6}>
                  <FormSwitch
                    id="customer-vip"
                    label="VIP customer"
                    {...register("vip")}
                  />
                </FormField>
                <FormField label="Tax ID (disabled demo)" htmlFor="customer-tax" span={6}>
                  <FormInput id="customer-tax" value="TAX-LOCKED" disabled readOnly />
                </FormField>
              </FormGrid>
            </FormSection>
            <FormActions
              onCancel={() => {
                reset();
                setSubmitted(false);
                setServerError(null);
                setStep(0);
              }}
              onSecondary={() => {
                setStep(0);
                setSubmitted(false);
              }}
              submitLabel="Submit"
              submitting={submitting}
            />
          </FormShell>
        </div>
      </DemoSection>
    </>
  );
}

function InvoiceFormDemo() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer: "",
      invoiceNumber: "INV-2026-0015",
      invoiceDate: "2026-08-08",
      dueDate: "2026-08-23",
      currency: "USD",
      status: "Draft",
      amount: "",
      notes: "",
      attachmentName: "",
    },
  });

  const values = watch();
  const amountNumber = Number(values.amount || 0);
  const estimatedTotal = Number.isFinite(amountNumber) ? amountNumber * 1.05 : 0;

  const summaryItems = useMemo(
    () => [
      { key: "type", label: "Record type", value: "Invoice" },
      { key: "module", label: "Module", value: "Finance" },
      { key: "status", label: "Status", value: values.status || "Draft" },
      {
        key: "total",
        label: "Estimated total",
        value: `$${estimatedTotal.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        emphasize: true,
      },
    ],
    [estimatedTotal, values.status]
  );

  async function onSubmit(_data: InvoiceFormValues) {
    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <DemoSection
      title="Form — Create Invoice"
      description="Date fields, currency, amount validation, file upload, and summary panel."
    >
      <div className="p-3 pt-0">
        {submitted ? (
          <p className="mb-2 rounded-md border border-erp-success/20 bg-erp-success-bg px-2.5 py-2 text-[11px] text-erp-success">
            Invoice submitted successfully (mock).
          </p>
        ) : null}
        <FormStepper
          steps={["Draft", "Review", "Approved"]}
          currentStep={0}
          className="mb-2"
        />
        <FormShell
          onSubmit={handleSubmit(onSubmit)}
          summary={
            <FormSummary
              items={summaryItems}
              footer={
                <>
                  1. Save draft
                  <br />
                  2. Review and submit
                  <br />
                  3. Approval workflow
                  <br />
                  4. Final confirmation
                </>
              }
            />
          }
          className="rounded-md"
        >
          <FormSection title="Primary information">
            <FormGrid>
              <FormField
                label="Customer"
                required
                htmlFor="invoice-customer"
                error={errors.customer?.message}
                span={6}
              >
                <FormSelect
                  id="invoice-customer"
                  placeholder="Select customer"
                  error={Boolean(errors.customer)}
                  options={[
                    { label: "HornRise Group", value: "HornRise Group" },
                    {
                      label: "Somali Development Agency",
                      value: "Somali Development Agency",
                    },
                    {
                      label: "East Africa Supplies Ltd",
                      value: "East Africa Supplies Ltd",
                    },
                  ]}
                  {...register("customer")}
                />
              </FormField>
              <FormField
                label="Invoice number"
                required
                htmlFor="invoice-number"
                error={errors.invoiceNumber?.message}
                span={6}
              >
                <FormInput
                  id="invoice-number"
                  error={Boolean(errors.invoiceNumber)}
                  {...register("invoiceNumber")}
                />
              </FormField>
              <FormField
                label="Invoice date"
                required
                htmlFor="invoice-date"
                error={errors.invoiceDate?.message}
                span={4}
              >
                <FormDatePicker
                  id="invoice-date"
                  error={Boolean(errors.invoiceDate)}
                  {...register("invoiceDate")}
                />
              </FormField>
              <FormField
                label="Due date"
                required
                htmlFor="invoice-due"
                error={errors.dueDate?.message}
                span={4}
              >
                <FormDatePicker
                  id="invoice-due"
                  error={Boolean(errors.dueDate)}
                  {...register("dueDate")}
                />
              </FormField>
              <FormField
                label="Currency"
                required
                htmlFor="invoice-currency"
                error={errors.currency?.message}
                span={4}
              >
                <FormSelect
                  id="invoice-currency"
                  error={Boolean(errors.currency)}
                  options={[
                    { label: "USD", value: "USD" },
                    { label: "SOS", value: "SOS" },
                    { label: "KES", value: "KES" },
                  ]}
                  {...register("currency")}
                />
              </FormField>
              <FormField
                label="Status"
                required
                htmlFor="invoice-status"
                error={errors.status?.message}
                span={4}
              >
                <FormSelect
                  id="invoice-status"
                  error={Boolean(errors.status)}
                  options={[
                    { label: "Draft", value: "Draft" },
                    { label: "Pending", value: "Pending" },
                    { label: "Approved", value: "Approved" },
                  ]}
                  {...register("status")}
                />
              </FormField>
              <FormField
                label="Amount"
                required
                htmlFor="invoice-amount"
                error={errors.amount?.message}
                span={4}
              >
                <FormInput
                  id="invoice-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  error={Boolean(errors.amount)}
                  {...register("amount")}
                />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Additional information">
            <FormGrid>
              <FormField
                label="Notes"
                htmlFor="invoice-notes"
                error={errors.notes?.message}
                span={12}
              >
                <FormTextarea
                  id="invoice-notes"
                  placeholder="Internal notes"
                  error={Boolean(errors.notes)}
                  {...register("notes")}
                />
              </FormField>
              <FormField label="Attachment" htmlFor="invoice-file" span={12}>
                <FormFileUpload
                  id="invoice-file"
                  accept=".pdf,.png,.jpg"
                  onFilesChange={(files) => {
                    setValue("attachmentName", files?.[0]?.name ?? "");
                  }}
                />
              </FormField>
            </FormGrid>
          </FormSection>
          <FormActions
            onCancel={() => {
              reset();
              setSubmitted(false);
            }}
            onSecondary={() => setSubmitted(false)}
            submitLabel="Submit"
            submitting={submitting}
          />
        </FormShell>
      </div>
    </DemoSection>
  );
}

export function FormDemos() {
  return (
    <>
      <CustomerFormDemo />
      <InvoiceFormDemo />
    </>
  );
}
