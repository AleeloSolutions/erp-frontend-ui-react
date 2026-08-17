import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import { AppShell, PageHeader, PageSubmenu } from "@/app";
import {
  FormDatePicker,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
} from "@erp/ui";
import { useToast } from "@erp/ui";
import { salesSubmenu } from "@/modules/sales/manifest";
import { useCreateQuotationMutation } from "@/modules/sales/api";
import { mockCustomers } from "@/modules/sales/data/demo-table";
import {
  quotationFormSchema,
  type QuotationFormValues,
} from "@/modules/sales/quotations/schema";
import { MockApiError } from "@/lib/mock";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function QuotationCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateQuotationMutation();

  const customerOptions = useMemo(
    () =>
      mockCustomers.map((customer) => ({
        label: customer.name,
        value: customer.name,
      })),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      customer: "",
      date: todayIso(),
      validUntil: plusDaysIso(30),
      status: "Draft",
      amount: "",
      notes: "",
    },
  });

  async function onSubmit(values: QuotationFormValues) {
    try {
      const quotation = await createMutation.mutateAsync({
        customer: values.customer,
        date: values.date,
        validUntil: values.validUntil,
        status: values.status,
        amount: Number(values.amount),
        notes: values.notes,
      });
      toast({
        title: "Quotation created",
        description: `${quotation.number} was added successfully.`,
        variant: "success",
      });
      navigate("/sales/quotations");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not create quotation.";
      toast({ title: "Create failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="create">
      <PageHeader
        module="Sales"
        section="Quotations"
        title="Create Quotation"
        description="Compose FormShell with a Query mutation and toast feedback."
        icon={<FileText className="h-4 w-4" aria-hidden />}
      />

      <PageSubmenu module="Sales" items={salesSubmenu} activeKey="quotations" />

      <FormShell
        title="New quotation"
        description='Required fields are marked. Choose a customer name containing "fail" to simulate a server error.'
        onSubmit={handleSubmit(onSubmit)}
        actionProps={{
          submitLabel: "Create quotation",
          submitting: createMutation.isPending,
          onCancel: () => navigate("/sales/quotations"),
        }}
      >
        <FormSection title="Quotation details">
          <FormGrid columns={12}>
            <FormField
              label="Customer"
              required
              htmlFor="quotation-customer"
              error={errors.customer?.message}
              span={6}
            >
              <FormSelect
                id="quotation-customer"
                error={Boolean(errors.customer)}
                options={[{ label: "Select customer", value: "" }, ...customerOptions]}
                {...register("customer")}
              />
            </FormField>
            <FormField
              label="Status"
              required
              htmlFor="quotation-status"
              error={errors.status?.message}
              span={6}
            >
              <FormSelect
                id="quotation-status"
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
              label="Date"
              required
              htmlFor="quotation-date"
              error={errors.date?.message}
              span={4}
            >
              <FormDatePicker
                id="quotation-date"
                error={Boolean(errors.date)}
                {...register("date")}
              />
            </FormField>
            <FormField
              label="Valid until"
              required
              htmlFor="quotation-valid-until"
              error={errors.validUntil?.message}
              span={4}
            >
              <FormDatePicker
                id="quotation-valid-until"
                error={Boolean(errors.validUntil)}
                {...register("validUntil")}
              />
            </FormField>
            <FormField
              label="Amount"
              required
              htmlFor="quotation-amount"
              error={errors.amount?.message}
              span={4}
            >
              <FormInput
                id="quotation-amount"
                type="number"
                step="0.01"
                min="0"
                error={Boolean(errors.amount)}
                {...register("amount")}
              />
            </FormField>
            <FormField
              label="Notes"
              htmlFor="quotation-notes"
              error={errors.notes?.message}
              span={12}
            >
              <FormTextarea
                id="quotation-notes"
                error={Boolean(errors.notes)}
                {...register("notes")}
              />
            </FormField>
          </FormGrid>
        </FormSection>
      </FormShell>
    </AppShell>
  );
}
