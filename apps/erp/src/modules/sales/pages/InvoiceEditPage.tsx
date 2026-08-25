import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Printer } from "lucide-react";
import { AppShell, useNavbarDefaults } from "@/app";
import {
  ControlPanel,
  FormDatePicker,
  FormDropdown,
  FormField,
  FormGrid,
  FormSection,
  FormSelect,
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
import { useInvoiceQuery, useUpdateInvoiceMutation } from "@/modules/sales/api";
import { mockCustomers } from "@/modules/sales/data/demo-table";
import {
  createEmptyInvoiceLine,
  invoiceFormSchema,
  type InvoiceFormValues,
  type InvoiceLineFormValue,
} from "@/modules/sales/invoices/schema";
import { MockApiError } from "@/lib/mock";

const statusSteps: StatusStep[] = [
  { key: "Draft", label: "Draft" },
  { key: "Posted", label: "Posted" },
];

const detailTabs = [
  { key: "lines", label: "Invoice Lines" },
  { key: "other", label: "Other Info" },
];

/** Invoice dates are stored pre-formatted for display (e.g. "01 Jul 2026") — convert back to an editable ISO date. */
function toIsoDate(display: string): string {
  const date = new Date(display);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function InvoiceEditPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const invoiceQuery = useInvoiceQuery(id);
  const updateMutation = useUpdateInvoiceMutation();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "invoices" });
  const [activeTab, setActiveTab] = useState("lines");
  const [lines, setLines] = useState<InvoiceLineFormValue[]>([]);
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
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customer: "",
      date: "",
      dueDate: "",
      status: "Draft",
      paymentStatus: "Not Paid",
      notes: "",
    },
  });

  useEffect(() => {
    if (!invoiceQuery.data) return;
    const invoice = invoiceQuery.data;
    reset({
      customer: invoice.customer,
      date: toIsoDate(invoice.date),
      dueDate: toIsoDate(invoice.dueDate),
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      notes: "",
    });
    setLines(
      invoice.lines.length > 0
        ? invoice.lines.map((line) => ({
            ...line,
            kind: "product" as const,
            product: "",
            account: "",
            taxRate: 0,
          }))
        : [createEmptyInvoiceLine()]
    );
  }, [invoiceQuery.data, reset]);

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const lineColumns: LineItemsColumn<InvoiceLineFormValue>[] = [
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

  async function onSubmit(values: InvoiceFormValues) {
    const validLines = lines.filter((line) => line.description.trim().length > 0);
    if (validLines.length === 0) {
      setLinesError("Add at least one line with a description.");
      setActiveTab("lines");
      return;
    }
    setLinesError(null);

    try {
      const invoice = await updateMutation.mutateAsync({
        id,
        input: {
          customer: values.customer,
          date: values.date,
          dueDate: values.dueDate,
          status: values.status,
          paymentStatus: values.paymentStatus,
          notes: values.notes,
          lines: validLines.map(({ description, quantity, unitPrice }) => ({
            description,
            quantity,
            unitPrice,
          })),
        },
      });
      toast({
        title: "Invoice updated",
        description: `${invoice.number} was saved.`,
        variant: "success",
      });
      navigate("/sales/invoices");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not update invoice.";
      toast({ title: "Update failed", description: message, variant: "error" });
    }
  }

  const loading = invoiceQuery.isLoading || invoiceQuery.isFetching;
  const notFound = invoiceQuery.isError;
  const status = watch("status");

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <ControlPanel
        pageActions={
          <PageActions
            breadcrumb={invoiceQuery.data?.number ?? "Edit Invoice"}
            buttons={
              invoiceQuery.data
                ? [
                    {
                      key: "print",
                      variant: "secondary",
                      onClick: () => navigate(`/sales/invoices/${id}/print`),
                      children: (
                        <>
                          <Printer className="h-3.5 w-3.5" aria-hidden /> Print
                        </>
                      ),
                    },
                  ]
                : []
            }
          />
        }
      />

      {notFound ? (
        <div className="rounded-[10px] border border-erp-border bg-erp-surface p-4 text-[12px] text-erp-muted">
          <p className="m-0 font-bold text-erp-text">Invoice not found</p>
          <p className="mt-1 mb-0">
            The invoice may have been deleted.{" "}
            <button
              type="button"
              className="font-bold text-erp-blue hover:underline"
              onClick={() => navigate("/sales/invoices")}
            >
              Back to invoices
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
              setValue("status", key as InvoiceFormValues["status"], {
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
                onClick: () => navigate("/sales/invoices"),
              },
            ]}
          />

          <FormShell onSubmit={handleSubmit(onSubmit)}>
            <FormSection title="Invoice details">
              <FormGrid columns={12}>
                <FormField
                  label="Customer"
                  required
                  htmlFor="invoice-customer"
                  error={errors.customer?.message}
                  span={6}
                >
                  <FormDropdown
                    id="invoice-customer"
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
                  label="Invoice date"
                  required
                  htmlFor="invoice-date"
                  error={errors.date?.message}
                  span={3}
                >
                  <FormDatePicker
                    id="invoice-date"
                    error={Boolean(errors.date)}
                    disabled={loading}
                    {...register("date")}
                  />
                </FormField>
                <FormField
                  label="Due date"
                  required
                  htmlFor="invoice-due-date"
                  error={errors.dueDate?.message}
                  span={3}
                >
                  <FormDatePicker
                    id="invoice-due-date"
                    error={Boolean(errors.dueDate)}
                    disabled={loading}
                    {...register("dueDate")}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <div>
              <Tabs
                items={detailTabs}
                activeKey={activeTab}
                onChange={setActiveTab}
                aria-label="Invoice details"
              />
              {activeTab === "lines" ? (
                <FormSection
                  title="Invoice lines"
                  description={linesError ?? undefined}
                  className="border-b-0"
                >
                  <LineItemsTable<InvoiceLineFormValue>
                    tableId="sales-invoice-edit-lines"
                    columns={lineColumns}
                    rows={lines}
                    onRowsChange={setLines}
                    createEmptyRow={createEmptyInvoiceLine}
                    aria-label="Invoice lines"
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
                      label="Payment status"
                      required
                      htmlFor="invoice-payment-status"
                      error={errors.paymentStatus?.message}
                      span={4}
                    >
                      <FormSelect
                        id="invoice-payment-status"
                        error={Boolean(errors.paymentStatus)}
                        disabled={loading}
                        options={[
                          { label: "Not Paid", value: "Not Paid" },
                          { label: "Partially Paid", value: "Partially Paid" },
                          { label: "Paid", value: "Paid" },
                          { label: "Overdue", value: "Overdue" },
                        ]}
                        {...register("paymentStatus")}
                      />
                    </FormField>
                    <FormField
                      label="Notes"
                      htmlFor="invoice-notes"
                      error={errors.notes?.message}
                      span={12}
                    >
                      <FormTextarea
                        id="invoice-notes"
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
