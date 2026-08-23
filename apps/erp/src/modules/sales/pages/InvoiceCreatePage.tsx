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
  FormSelect,
  FormShell,
  FormStatusBar,
  FormTextarea,
  Input,
  LineItemsTable,
  PageActions,
  Tabs,
  formatCurrency,
  type LineItemsColumn,
  type StatusStep,
} from "@erp/ui";
import { useToast } from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCreateInvoiceMutation } from "@/modules/sales/api";
import { mockCustomers } from "@/modules/sales/data/demo-table";
import {
  createEmptyInvoiceLine,
  invoiceFormSchema,
  type InvoiceFormValues,
  type InvoiceLineFormValue,
} from "@/modules/sales/invoices/schema";
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
  { key: "Posted", label: "Posted" },
];

const detailTabs = [
  { key: "lines", label: "Invoice Lines" },
  { key: "journal", label: "Journal Items", disabled: true },
  { key: "other", label: "Other Info" },
];

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "invoices" });
  const createMutation = useCreateInvoiceMutation();
  const [activeTab, setActiveTab] = useState("lines");
  const [lines, setLines] = useState<InvoiceLineFormValue[]>([createEmptyInvoiceLine()]);
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
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customer: "",
      date: todayIso(),
      dueDate: plusDaysIso(15),
      status: "Draft",
      paymentStatus: "Not Paid",
      notes: "",
    },
  });

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const lineColumns: LineItemsColumn<InvoiceLineFormValue>[] = [
    {
      key: "description",
      label: "Product",
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
      label: "Price",
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
      key: "amount",
      label: "Amount",
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
      const invoice = await createMutation.mutateAsync({
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
      });
      toast({
        title: "Invoice created",
        description: `${invoice.number} was added successfully.`,
        variant: "success",
      });
      navigate("/sales/invoices");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not create invoice.";
      toast({ title: "Create failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <ControlPanel pageActions={<PageActions breadcrumb="New Invoice" />} />

      <FormStatusBar
        steps={statusSteps}
        currentStepKey={watch("status")}
        onStepChange={(key) =>
          setValue("status", key as InvoiceFormValues["status"], { shouldDirty: true })
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
            onClick: () => navigate("/sales/invoices"),
          },
        ]}
      />

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 pt-4">
          <p className="m-0 text-[11px] font-bold text-erp-subtle">Customer Invoice</p>
          <h1 className="m-0 text-[2rem] font-bold leading-tight text-erp-text">
            {watch("status")}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-3 px-4 py-4 sm:grid-cols-2">
          <div className="max-w-sm">
            <label
              className="block text-[12px] font-bold text-erp-text"
              htmlFor="invoice-customer"
            >
              Customer<span className="text-erp-error"> *</span>
            </label>
            <FormDropdown
              id="invoice-customer"
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
            {errors.customer ? (
              <p className="m-0 mt-1 text-[10px] text-erp-error">
                {errors.customer.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex items-center gap-3">
              <label
                className="text-[12px] font-bold text-erp-text"
                htmlFor="invoice-date"
              >
                Invoice Date<span className="text-erp-error"> *</span>
              </label>
              <FormDatePicker
                id="invoice-date"
                className="w-40"
                error={Boolean(errors.date)}
                {...register("date")}
              />
            </div>
            <div className="flex items-center gap-3">
              <label
                className="text-[12px] font-bold text-erp-text"
                htmlFor="invoice-due-date"
              >
                Due Date<span className="text-erp-error"> *</span>
              </label>
              <FormDatePicker
                id="invoice-due-date"
                className="w-40"
                error={Boolean(errors.dueDate)}
                {...register("dueDate")}
              />
            </div>
          </div>
        </div>

        <Tabs
          items={detailTabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          aria-label="Invoice details"
        />

        {activeTab === "lines" ? (
          <div className="px-2 py-3">
            <LineItemsTable<InvoiceLineFormValue>
              tableId="sales-invoice-create-lines"
              columns={lineColumns}
              rows={lines}
              onRowsChange={setLines}
              createEmptyRow={createEmptyInvoiceLine}
              aria-label="Invoice lines"
            />
            {linesError ? (
              <p className="m-0 mt-2 px-2 text-[11px] text-erp-error">{linesError}</p>
            ) : null}
            <div className="mt-3 flex justify-end px-2">
              <dl className="m-0 w-64 text-[13px]">
                <div className="flex items-center justify-between py-0.5">
                  <dt className="text-erp-muted">Untaxed Amount:</dt>
                  <dd className="m-0 font-bold text-erp-text">{formatCurrency(total)}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-erp-border py-1.5">
                  <dt className="text-erp-muted">Total:</dt>
                  <dd className="m-0 text-[15px] font-bold text-erp-text">
                    {formatCurrency(total)}
                  </dd>
                </div>
                <div className="flex items-center justify-between pt-1.5">
                  <dt className="text-erp-subtle">Amount Due:</dt>
                  <dd className="m-0 text-[15px] font-bold text-erp-text">
                    {formatCurrency(total)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <FormField
              label="Payment status"
              required
              htmlFor="invoice-payment-status"
              error={errors.paymentStatus?.message}
              span={4}
              className="mb-3"
            >
              <FormSelect
                id="invoice-payment-status"
                error={Boolean(errors.paymentStatus)}
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
              label="Terms and Conditions"
              htmlFor="invoice-notes"
              error={errors.notes?.message}
            >
              <FormTextarea
                id="invoice-notes"
                error={Boolean(errors.notes)}
                {...register("notes")}
              />
            </FormField>
          </div>
        )}
      </FormShell>
    </AppShell>
  );
}
