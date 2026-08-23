import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell, useNavbarDefaults } from "@/app";
import {
  ControlPanel,
  FormDatePicker,
  FormDropdown,
  FormField,
  FormGrid,
  FormSection,
  FormShell,
  FormStatusBar,
  FormTextarea,
  Input,
  LineItemsTable,
  PageActions,
  formatCurrency,
  type LineItemsColumn,
  type StatusStep,
} from "@erp/ui";
import { useToast } from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCreateQuotationMutation } from "@/modules/sales/api";
import { mockCustomers } from "@/modules/sales/data/demo-table";
import {
  createEmptyQuotationLine,
  quotationFormSchema,
  type QuotationFormValues,
  type QuotationLineFormValue,
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

const statusSteps: StatusStep[] = [
  { key: "Draft", label: "Draft" },
  { key: "Pending", label: "Pending" },
  { key: "Approved", label: "Approved" },
];

export default function QuotationCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "quotations" });
  const createMutation = useCreateQuotationMutation();
  const [lines, setLines] = useState<QuotationLineFormValue[]>([
    createEmptyQuotationLine(),
  ]);
  const [linesError, setLinesError] = useState<string | null>(null);

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      customer: "",
      date: todayIso(),
      validUntil: plusDaysIso(30),
      status: "Draft",
      notes: "",
    },
  });

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const lineColumns: LineItemsColumn<QuotationLineFormValue>[] = [
    {
      key: "description",
      label: "Description",
      size: 320,
      minSize: 200,
      renderCell: (row, { onChange, onCommit }) => (
        <Input
          chrome="cell"
          value={row.description}
          placeholder="Line description"
          onChange={(e) => onChange({ description: e.target.value })}
          onBlur={onCommit}
        />
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      align: "end",
      size: 100,
      minSize: 70,
      renderCell: (row, { onChange, onCommit }) => (
        <Input
          type="number"
          chrome="cell"
          className="text-end"
          value={row.quantity}
          onChange={(e) => onChange({ quantity: Number(e.target.value) })}
          onBlur={onCommit}
        />
      ),
    },
    {
      key: "unitPrice",
      label: "Unit Price",
      align: "end",
      size: 110,
      minSize: 80,
      renderCell: (row, { onChange, onCommit }) => (
        <Input
          type="number"
          step="0.01"
          chrome="cell"
          className="text-end"
          value={row.unitPrice}
          onChange={(e) => onChange({ unitPrice: Number(e.target.value) })}
          onBlur={onCommit}
        />
      ),
    },
    {
      key: "subtotal",
      label: "Subtotal",
      align: "end",
      size: 120,
      hideable: false,
      renderCell: (row) => (
        <span className="font-bold">{formatCurrency(row.quantity * row.unitPrice)}</span>
      ),
    },
  ];

  async function onSubmit(values: QuotationFormValues) {
    const validLines = lines.filter((line) => line.description.trim().length > 0);
    if (validLines.length === 0) {
      setLinesError("Add at least one line with a description.");
      return;
    }
    setLinesError(null);

    try {
      const quotation = await createMutation.mutateAsync({
        customer: values.customer,
        date: values.date,
        validUntil: values.validUntil,
        status: values.status,
        notes: values.notes,
        lines: validLines.map(({ description, quantity, unitPrice }) => ({
          description,
          quantity,
          unitPrice,
        })),
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
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <ControlPanel pageActions={<PageActions breadcrumb="New Quotation" />} />

      <FormStatusBar
        belowControlPanel
        steps={statusSteps}
        currentStepKey={watch("status")}
        onStepChange={(key) =>
          setValue("status", key as QuotationFormValues["status"], { shouldDirty: true })
        }
        actions={[
          {
            key: "create",
            label: "Confirm",
            variant: "primary",
            loading: createMutation.isPending,
            onClick: handleSubmit(onSubmit),
          },
          {
            key: "cancel",
            label: "Cancel",
            variant: "secondary",
            disabled: createMutation.isPending,
            onClick: () => navigate("/sales/quotations"),
          },
        ]}
      />

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <FormSection title="Quotation details">
          <FormGrid columns={12}>
            <FormField
              label="Customer"
              required
              htmlFor="quotation-customer"
              error={errors.customer?.message}
              span={6}
            >
              <FormDropdown
                id="quotation-customer"
                searchable
                placeholder="Search customer..."
                error={Boolean(errors.customer)}
                value={watch("customer") || null}
                items={customerOptions.map((option) => ({
                  key: option.value,
                  label: option.label,
                }))}
                onChange={(key) =>
                  setValue("customer", key ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
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

        <FormSection title="Order lines" description={linesError ?? undefined}>
          <LineItemsTable<QuotationLineFormValue>
            tableId="sales-quotation-create-lines"
            columns={lineColumns}
            rows={lines}
            onRowsChange={setLines}
            createEmptyRow={createEmptyQuotationLine}
            aria-label="Quotation lines"
          />
          <div className="flex justify-end border-t border-erp-border px-2 py-2">
            <div className="flex items-center gap-3 text-[13px]">
              <span className="font-bold text-erp-text">Total</span>
              <span className="font-bold text-erp-text">{formatCurrency(total)}</span>
            </div>
          </div>
        </FormSection>
      </FormShell>
    </AppShell>
  );
}
