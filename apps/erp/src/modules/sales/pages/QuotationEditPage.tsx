import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Tabs,
  formatCurrency,
  useToast,
  type LineItemsColumn,
  type StatusStep,
} from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useQuotationQuery, useUpdateQuotationMutation } from "@/modules/sales/api";
import { mockCustomers } from "@/modules/sales/data/demo-table";
import {
  createEmptyQuotationLine,
  quotationFormSchema,
  type QuotationFormValues,
  type QuotationLineFormValue,
} from "@/modules/sales/quotations/schema";
import { MockApiError } from "@/lib/mock";

const statusSteps: StatusStep[] = [
  { key: "Draft", label: "Draft" },
  { key: "Pending", label: "Pending" },
  { key: "Approved", label: "Approved" },
];

const detailTabs = [
  { key: "lines", label: "Order Lines" },
  { key: "other", label: "Other Info" },
];

/** Quotation dates are stored pre-formatted for display (e.g. "01 Jul 2026") — convert back to an editable ISO date. */
function toIsoDate(display: string): string {
  const date = new Date(display);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function QuotationEditPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const quotationQuery = useQuotationQuery(id);
  const updateMutation = useUpdateQuotationMutation();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "quotations" });
  const [activeTab, setActiveTab] = useState("lines");
  const [lines, setLines] = useState<QuotationLineFormValue[]>([]);
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
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      customer: "",
      date: "",
      validUntil: "",
      status: "Draft",
      notes: "",
    },
  });

  useEffect(() => {
    if (!quotationQuery.data) return;
    const quotation = quotationQuery.data;
    reset({
      customer: quotation.customer,
      date: toIsoDate(quotation.date),
      validUntil: toIsoDate(quotation.validUntil),
      status: quotation.status,
      notes: "",
    });
    setLines(quotation.lines.length > 0 ? quotation.lines : [createEmptyQuotationLine()]);
  }, [quotationQuery.data, reset]);

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
      setActiveTab("lines");
      return;
    }
    setLinesError(null);

    try {
      const quotation = await updateMutation.mutateAsync({
        id,
        input: {
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
        },
      });
      toast({
        title: "Quotation updated",
        description: `${quotation.number} was saved.`,
        variant: "success",
      });
      navigate("/sales/quotations");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not update quotation.";
      toast({ title: "Update failed", description: message, variant: "error" });
    }
  }

  const loading = quotationQuery.isLoading || quotationQuery.isFetching;
  const notFound = quotationQuery.isError;
  const status = watch("status");

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <ControlPanel
        pageActions={
          <PageActions breadcrumb={quotationQuery.data?.number ?? "Edit Quotation"} />
        }
      />

      {notFound ? (
        <div className="rounded-[10px] border border-erp-border bg-erp-surface p-4 text-[12px] text-erp-muted">
          <p className="m-0 font-bold text-erp-text">Quotation not found</p>
          <p className="mt-1 mb-0">
            The quotation may have been deleted.{" "}
            <button
              type="button"
              className="font-bold text-erp-blue hover:underline"
              onClick={() => navigate("/sales/quotations")}
            >
              Back to quotations
            </button>
          </p>
        </div>
      ) : (
        <>
          <FormStatusBar
            belowControlPanel
            steps={statusSteps}
            currentStepKey={status}
            onStepChange={(key) =>
              setValue("status", key as QuotationFormValues["status"], {
                shouldDirty: true,
              })
            }
            actions={[
              {
                key: "save",
                label: "Confirm",
                variant: "primary",
                loading: updateMutation.isPending,
                disabled: loading,
                onClick: handleSubmit(onSubmit),
              },
              {
                key: "cancel",
                label: "Cancel",
                variant: "secondary",
                disabled: updateMutation.isPending,
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
                    disabled={loading}
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
                  span={3}
                >
                  <FormDatePicker
                    id="quotation-date"
                    error={Boolean(errors.date)}
                    disabled={loading}
                    {...register("date")}
                  />
                </FormField>
                <FormField
                  label="Valid until"
                  required
                  htmlFor="quotation-valid-until"
                  error={errors.validUntil?.message}
                  span={3}
                >
                  <FormDatePicker
                    id="quotation-valid-until"
                    error={Boolean(errors.validUntil)}
                    disabled={loading}
                    {...register("validUntil")}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <div>
              <Tabs
                items={detailTabs}
                activeKey={activeTab}
                onChange={setActiveTab}
                aria-label="Quotation details"
              />
              {activeTab === "lines" ? (
                <FormSection
                  title="Order lines"
                  description={linesError ?? undefined}
                  className="border-b-0"
                >
                  <LineItemsTable<QuotationLineFormValue>
                    tableId="sales-quotation-edit-lines"
                    columns={lineColumns}
                    rows={lines}
                    onRowsChange={setLines}
                    createEmptyRow={createEmptyQuotationLine}
                    aria-label="Quotation lines"
                  />
                  <div className="flex justify-end border-t border-erp-border px-2 py-2">
                    <div className="flex items-center gap-3 text-[13px]">
                      <span className="font-bold text-erp-text">Total</span>
                      <span className="font-bold text-erp-text">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </FormSection>
              ) : (
                <FormSection title="Other info" className="border-b-0">
                  <FormGrid columns={12}>
                    <FormField
                      label="Notes"
                      htmlFor="quotation-notes"
                      error={errors.notes?.message}
                      span={12}
                    >
                      <FormTextarea
                        id="quotation-notes"
                        error={Boolean(errors.notes)}
                        disabled={loading}
                        {...register("notes")}
                      />
                    </FormField>
                  </FormGrid>
                </FormSection>
              )}
            </div>
          </FormShell>
        </>
      )}
    </AppShell>
  );
}
