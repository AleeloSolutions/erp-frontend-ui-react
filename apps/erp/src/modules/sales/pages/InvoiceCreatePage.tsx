import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { AppShell, useNavbarDefaults } from "@/app";
import {
  ControlPanel,
  Dropdown,
  FormDatePicker,
  FormDropdown,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormStatusBar,
  FormTextarea,
  Input,
  LineItemsTable,
  PageActions,
  Tabs,
  Textarea,
  formatCurrency,
  type DropdownItem,
  type LineItemsColumn,
  type LineItemsRowHelpers,
  type LineItemsSpecialRow,
  type StatusStep,
} from "@erp/ui";
import { useToast } from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCreateInvoiceMutation } from "@/modules/sales/api";
import { mockCustomers } from "@/modules/sales/data/demo-table";
import { mockProducts } from "@/modules/inventory/data/demo-products";
import {
  createEmptyInvoiceLine,
  createInvoiceNoteLine,
  createInvoiceSectionLine,
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
  { key: "journal", label: "Journal Items" },
  { key: "other", label: "Other Info" },
];

/** No chart-of-accounts module exists yet — this is the same fixed set the design system's storybook demo uses. */
const accountItems: DropdownItem[] = [
  { key: "400000 Product Sales", label: "400000 Product Sales" },
  { key: "400010 Service Revenue", label: "400010 Service Revenue" },
  { key: "400020 Discounts", label: "400020 Discounts" },
];

const productItems: DropdownItem[] = mockProducts
  .filter((product) => product.status === "Active")
  .map((product) => ({ key: product.id, label: product.name }));

/** Odoo behavior: a section subtotals every product row below it, down to the next section (or the end). */
function sectionSubtotal(
  sectionLine: InvoiceLineFormValue,
  allLines: InvoiceLineFormValue[]
) {
  const startIndex = allLines.findIndex((line) => line.id === sectionLine.id);
  let sum = 0;
  for (let i = startIndex + 1; i < allLines.length; i++) {
    const line = allLines[i];
    if (line.kind === "section") break;
    if (line.kind === "product") sum += line.quantity * line.unitPrice;
  }
  return sum;
}

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
      customerReference: "",
      salesperson: "",
      salesTeam: "",
      recipientBank: "",
      paymentReference: "",
      deliveryDate: "",
      incoterm: "",
      incotermLocation: "",
      fiscalPosition: "",
      paymentMethod: "",
      autoPost: "No",
    },
  });

  const total = lines.reduce(
    (sum, line) => (line.kind === "product" ? sum + line.quantity * line.unitPrice : sum),
    0
  );

  const lineColumns: LineItemsColumn<InvoiceLineFormValue>[] = [
    {
      key: "product",
      label: "Product",
      size: 260,
      minSize: 160,
      maxSize: 440,
      renderCell: (row, { onChange, onCommit }) => (
        <div className="flex flex-col gap-0.5">
          <Dropdown
            trigger="field"
            searchable
            allowFreeText
            hideChevron
            chrome="cell"
            placeholder="Search a product"
            value={row.product || null}
            items={productItems}

            onChange={(key) => {
              const selectedProduct = mockProducts.find((product) => product.id === key);
              onChange({
                product: key ?? "",
                unitPrice: selectedProduct?.unitPrice ?? row.unitPrice,
                description: selectedProduct?.description ?? row.description,
              });
              onCommit();
            }}
          />
          <Textarea
            autoGrow
            chrome="cell"
            value={row.description}
            placeholder="Enter a description"
            className="text-base italic text-erp-muted"
            onChange={(e) => onChange({ description: e.target.value })}
            onBlur={onCommit}
          />
        </div>
      ),
    },
    {
      key: "account",
      label: "Account",
      size: 170,
      minSize: 120,
      maxSize: 300,
      renderCell: (row, { onChange, onCommit }) => (
        <Dropdown
          trigger="field"
          searchable
          allowFreeText
          chrome="cell"
          value={row.account || null}
          items={accountItems}
          onChange={(key) => {
            onChange({ account: key ?? "" });
            onCommit();
          }}
        />
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      align: "end",
      size: 75,
      minSize: 60,
      maxSize: 120,
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
      size: 75,
      minSize: 60,
      maxSize: 120,
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
      key: "taxes",
      label: "Taxes",
      size: 90,
      minSize: 70,
      maxSize: 150,
      renderCell: (row, { onChange, onCommit }) =>
        row.taxRate > 0 ? (
          <span className="inline-flex h-[18px] items-center gap-1 rounded-full bg-erp-header pl-1.5 pr-1 text-[8px] font-bold tracking-[0.02em] text-erp-muted">
            {row.taxRate}%
            <button
              type="button"
              aria-label="Remove tax"
              className="rounded-full hover:bg-erp-surface-hover"
              onClick={() => {
                onChange({ taxRate: 0 });
                onCommit();
              }}
            >
              <X className="h-2.5 w-2.5" aria-hidden />
            </button>
          </span>
        ) : null,
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

  function getInvoiceSpecialRow(
    row: InvoiceLineFormValue,
    { onChange, onCommit }: LineItemsRowHelpers<InvoiceLineFormValue>
  ): LineItemsSpecialRow | undefined {
    if (row.kind === "section") {
      return {
        content: (
          <Textarea
            autoGrow
            chrome="cell"
            value={row.description}
            placeholder="Section"
            className=""
            onChange={(e) => onChange({ description: e.target.value })}
            onBlur={onCommit}
          />
        ),
        trailingCells: [
          <span key="amount" className="font-bold">
            {formatCurrency(sectionSubtotal(row, lines))}
          </span>,
        ],
      };
    }
    if (row.kind === "note") {
      return {
        content: (
          <Textarea
            autoGrow
            chrome="cell"
            value={row.description}
            placeholder="Note"
            className="italic text-erp-muted"
            onChange={(e) => onChange({ description: e.target.value })}
            onBlur={onCommit}
          />
        ),
      };
    }
    return undefined;
  }

  async function onSubmit(values: InvoiceFormValues) {
    const validLines = lines.filter(
      (line) => line.kind === "product" && line.description.trim().length > 0
    );
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
        belowControlPanel
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
        <div className="">
          {/* px-6 pt-6 */}
          <p className="m-0 text-[0.875rem] font-[500] text-[#000]">Customer Invoice</p>
          <h1 className="m-0  mt-[0.2em] mb-[0.2em] text-[2.1rem] font-[500] leading-tight text-erp-tex t">
            {watch("status")}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-2  sm:grid-cols-2">
          {/* px-6 py-3 */}
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
              <label
                className="text-base font-[500] text-base"
                htmlFor="invoice-customer"
              >
                Customer<span className="text-erp-error"> *</span>
              </label>
              <div className="max-w-sm">
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
              </div>
            </div>
            {errors.customer ? (
              <p className="m-0 mt-1 text-[8px] text-erp-error">
                {errors.customer.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5">
            <label className="font-semibold" htmlFor="invoice-date">
              Invoice Date<span className="text-erp-error"> *</span>
            </label>
            <FormDatePicker
              id="invoice-date"
              className=""
              error={Boolean(errors.date)}
              {...register("date")}
            />
            <label className="font-semibold font-[500]" htmlFor="invoice-due-date">
              Due Date<span className="text-erp-error"> *</span>
            </label>
            <FormDatePicker
              id="invoice-due-date"
              className=""
              error={Boolean(errors.dueDate)}
              {...register("dueDate")}
            />
          </div>
        </div>

        <Tabs
          items={detailTabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          className=""
          aria-label="Invoice details"
        />

        {activeTab === "lines" ? (
          <div className="">
            {/* //px-2 py-2 */}
            <LineItemsTable<InvoiceLineFormValue>
              tableId="sales-invoice-create-lines"
              columns={lineColumns}
              rows={lines}
              onRowsChange={setLines}
              createEmptyRow={createEmptyInvoiceLine}
              getSpecialRow={getInvoiceSpecialRow}
              secondaryFooterActions={[
                {
                  key: "section",
                  label: "Add a section",
                  onClick: () =>
                    setLines((prev) => [...prev, createInvoiceSectionLine()]),
                },
                {
                  key: "note",
                  label: "Add a note",
                  onClick: () => setLines((prev) => [...prev, createInvoiceNoteLine()]),
                },
              ]}
              aria-label="Invoice lines"
            />
            {linesError ? (
              <p className="m-0 mt-1.5 px-2 text-[8px] text-erp-error">{linesError}</p>
            ) : null}
            <div className="mt-0 flex justify-end px-2">
              <div className="w-68 border-t border-t-erp-muted pt-2">
                <dl className="m-0 w-54 mx-auto ">
                  <div className="flex items-center justify-between py-0.5">
                    <dt className="">Untaxed Amount:</dt>
                    <dd className="m-0 font-[600] text-[1rem]">{formatCurrency(total)}</dd>
                  </div>
                  <div className="flex items-center justify-between  border-erp-border py-1">
                    <dt>Total:</dt>
                    <dd className="m-0 text-[1.2rem] font-bold border-t border-t-erp-muted pt-2">{formatCurrency(total)}</dd>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <dt className="text-base text-erp-muted">Amount Due:</dt>
                    <dd className="m-0 text-[1.2rem] font-[600] border-t border-t-erp-muted pt-2 border-t-erp-muted">
                      {formatCurrency(total)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <FormSection title="Invoice" className="border-b-0">
                <FormGrid>
                  <FormField
                    label="Customer Reference"
                    htmlFor="invoice-customer-reference"
                    span={12}
                  >
                    <FormInput
                      id="invoice-customer-reference"
                      {...register("customerReference")}
                    />
                  </FormField>
                  <FormField label="Salesperson" htmlFor="invoice-salesperson" span={12}>
                    <FormInput
                      id="invoice-salesperson"
                      placeholder="Salesperson"
                      {...register("salesperson")}
                    />
                  </FormField>
                  <FormField label="Sales Team" htmlFor="invoice-sales-team" span={12}>
                    <FormInput
                      id="invoice-sales-team"
                      placeholder="Sales team"
                      {...register("salesTeam")}
                    />
                  </FormField>
                  <FormField
                    label="Recipient Bank"
                    htmlFor="invoice-recipient-bank"
                    span={12}
                  >
                    <FormInput
                      id="invoice-recipient-bank"
                      {...register("recipientBank")}
                    />
                  </FormField>
                  <FormField
                    label="Payment Reference"
                    htmlFor="invoice-payment-reference"
                    span={12}
                  >
                    <FormInput
                      id="invoice-payment-reference"
                      placeholder="Standard communication"
                      {...register("paymentReference")}
                    />
                  </FormField>
                  <FormField
                    label="Delivery Date"
                    htmlFor="invoice-delivery-date"
                    span={12}
                  >
                    <FormDatePicker
                      id="invoice-delivery-date"
                      {...register("deliveryDate")}
                    />
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection title="Accounting" className="border-b-0">
                <FormGrid>
                  <FormField label="Incoterm" htmlFor="invoice-incoterm" span={12}>
                    <FormInput
                      id="invoice-incoterm"
                      placeholder="Define a default in the settings"
                      {...register("incoterm")}
                    />
                  </FormField>
                  <FormField
                    label="Incoterm Location"
                    htmlFor="invoice-incoterm-location"
                    span={12}
                  >
                    <FormInput
                      id="invoice-incoterm-location"
                      {...register("incotermLocation")}
                    />
                  </FormField>
                  <FormField
                    label="Fiscal Position"
                    htmlFor="invoice-fiscal-position"
                    span={12}
                  >
                    <FormInput
                      id="invoice-fiscal-position"
                      {...register("fiscalPosition")}
                    />
                  </FormField>
                  <FormField
                    label="Payment Method"
                    htmlFor="invoice-payment-method"
                    span={12}
                  >
                    <FormInput
                      id="invoice-payment-method"
                      {...register("paymentMethod")}
                    />
                  </FormField>
                  <FormField label="Auto-post" htmlFor="invoice-auto-post" span={12}>
                    <FormSelect
                      id="invoice-auto-post"
                      options={[
                        { label: "No", value: "No" },
                        { label: "Yes", value: "Yes" },
                      ]}
                      {...register("autoPost")}
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
            </div>

            <FormSection title="Other info" className="border-b-0">
              <FormGrid>
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
                  span={12}
                >
                  <FormTextarea
                    id="invoice-notes"
                    error={Boolean(errors.notes)}
                    {...register("notes")}
                  />
                </FormField>
              </FormGrid>
            </FormSection>
          </>
        )}
      </FormShell>
    </AppShell>
  );
}
