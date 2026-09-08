/**
 * New invoice, against `/api/v1/sales/invoices/`.
 *
 * A new invoice is always a draft: `POST` stores it, and only posting it
 * later allocates a number. Nothing here computes what will be charged —
 * the amounts beside the lines are the editor's own estimate, shown so the
 * page is not blank while the draft is typed, and they are replaced by the
 * server's figures the moment it is saved.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormStickyHeader,
  FormTextarea,
  Input,
  LineItemsTable,
  PageActions,
  Tabs,
  Textarea,
  useToast,
  type DropdownItem,
  type LineItemsColumn,
  type LineItemsRowHelpers,
  type LineItemsSpecialRow,
  type StatusStep,
} from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCustomersQuery } from "@/modules/sales/customers";
import { useCreateInvoiceMutation } from "../queries";
import { useTaxesQuery } from "@/modules/sales/shared";
import {
  createEmptyInvoiceLine,
  createInvoiceNoteLine,
  createInvoiceSectionLine,
  dueDateFrom,
  emptyInvoiceForm,
  estimateLineAmount,
  estimateUntaxedTotal,
  formatMoney,
  hasChargeableLine,
  invoiceFormSchema,
  toLineInputs,
  type InvoiceFormValues,
  type InvoiceLineFormValue,
} from "@/modules/sales/invoices/schema";
import { ApiError } from "@/lib/api-client";

/** Read-only until it is saved and posted — posting is its own action. */
const statusSteps: StatusStep[] = [
  { key: "draft", label: "Draft" },
  { key: "posted", label: "Posted" },
];

const detailTabs = [
  { key: "lines", label: "Invoice Lines" },
  { key: "other", label: "Other Info" },
];

/** Odoo behaviour: a section subtotals every product row below it, down to the next section. */
function sectionEstimate(
  sectionLine: InvoiceLineFormValue,
  allLines: InvoiceLineFormValue[]
) {
  const startIndex = allLines.findIndex((line) => line.id === sectionLine.id);
  let sum = 0;
  for (let i = startIndex + 1; i < allLines.length; i++) {
    const line = allLines[i];
    if (line.kind === "section") break;
    sum += estimateLineAmount(line);
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

  // One page of customers feeds the picker; the Dropdown filters what it
  // was given, so a tenant past this many needs a server-backed search.
  const customersQuery = useCustomersQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });
  const taxesQuery = useTaxesQuery();

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const taxes = useMemo(
    () => (taxesQuery.data?.data ?? []).filter((tax) => !tax.is_archived),
    [taxesQuery.data]
  );
  const defaultTax = taxes.find((tax) => tax.is_default) ?? null;

  const customerItems = useMemo<DropdownItem[]>(
    () => customers.map((customer) => ({ key: customer.uuid, label: customer.name })),
    [customers]
  );
  const taxItems = useMemo<DropdownItem[]>(
    () => taxes.map((tax) => ({ key: tax.uuid, label: `${tax.name} (${tax.rate}%)` })),
    [taxes]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: emptyInvoiceForm(),
  });

  const customerUuid = watch("customer");
  const selectedCustomer = customers.find((customer) => customer.uuid === customerUuid);
  const currency = selectedCustomer?.currency ?? "";

  // The tenant's default tax only arrives after the first render; seed it
  // into the untouched starter rows rather than making it a manual step.
  useEffect(() => {
    if (!defaultTax) return;
    setLines((previous) =>
      previous.map((line) =>
        line.kind === "product" && line.tax === null && line.description === ""
          ? { ...line, tax: defaultTax.uuid }
          : line
      )
    );
  }, [defaultTax]);

  const untaxedEstimate = estimateUntaxedTotal(lines);

  const lineColumns: LineItemsColumn<InvoiceLineFormValue>[] = [
    {
      key: "description",
      label: "Description",
      size: 340,
      minSize: 200,
      maxSize: 560,
      renderCell: (row, { onChange, onCommit }) => (
        <Textarea
          autoGrow
          chrome="cell"
          value={row.description}
          placeholder="What is being charged for"
          onChange={(event) => onChange({ description: event.target.value })}
          onBlur={onCommit}
        />
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      align: "end",
      size: 90,
      minSize: 70,
      maxSize: 140,
      renderCell: (row, { onChange, onCommit }) => (
        // Text, not number: the API takes decimals as strings and a number
        // input would round "0.10" into whatever the browser prefers.
        <Input
          inputMode="decimal"
          chrome="cell"
          className="text-end"
          value={row.quantity}
          onChange={(event) => onChange({ quantity: event.target.value })}
          onBlur={onCommit}
        />
      ),
    },
    {
      key: "unit_price",
      label: "Price",
      align: "end",
      size: 100,
      minSize: 80,
      maxSize: 160,
      renderCell: (row, { onChange, onCommit }) => (
        <Input
          inputMode="decimal"
          chrome="cell"
          className="text-end"
          value={row.unit_price}
          onChange={(event) => onChange({ unit_price: event.target.value })}
          onBlur={onCommit}
        />
      ),
    },
    {
      key: "tax",
      label: "Taxes",
      size: 150,
      minSize: 110,
      maxSize: 220,
      renderCell: (row, { onChange, onCommit }) => (
        <Dropdown
          trigger="field"
          searchable
          clearable
          chrome="cell"
          placeholder="No tax"
          value={row.tax}
          items={taxItems}
          onChange={(key) => {
            onChange({ tax: key });
            onCommit();
          }}
        />
      ),
    },
    {
      key: "amount",
      label: "Amount",
      align: "end",
      size: 130,
      hideable: false,
      renderCell: (row) => (
        <span className="font-bold">
          {formatMoney(estimateLineAmount(row).toFixed(2), currency)}
        </span>
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
            onChange={(event) => onChange({ description: event.target.value })}
            onBlur={onCommit}
          />
        ),
        trailingCells: [
          <span key="amount" className="font-bold">
            {formatMoney(sectionEstimate(row, lines).toFixed(2), currency)}
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
            onChange={(event) => onChange({ description: event.target.value })}
            onBlur={onCommit}
          />
        ),
      };
    }
    return undefined;
  }

  async function onSubmit(values: InvoiceFormValues) {
    if (!hasChargeableLine(lines)) {
      setLinesError("Add at least one line with a description.");
      setActiveTab("lines");
      return;
    }
    setLinesError(null);

    try {
      const invoice = await createMutation.mutateAsync({
        ...values,
        lines: toLineInputs(lines),
      });
      toast({
        title: "Draft invoice created",
        description: "It gets its number when you post it.",
        variant: "success",
      });
      // Straight to the record: posting, and the server's real totals, live there.
      navigate(`/sales/invoices/${invoice.uuid}/edit`);
    } catch (error) {
      // The API owns the rules the form cannot know — a customer over their
      // credit limit, a tax that no longer applies.
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field in invoiceFormSchema.shape) {
            setError(field as keyof InvoiceFormValues, { message: messages[0] });
          }
        }
      }
      toast({
        title: "Could not create the invoice",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={<PageActions breadcrumb="New Invoice" />}
        />

        <FormStatusBar
          sticky={false}
          steps={statusSteps}
          currentStepKey="draft"
          actions={[
            {
              key: "create",
              label: "Save",
              variant: "primary",
              loading: createMutation.isPending,
              onClick: handleSubmit(onSubmit),
            },
            {
              key: "discard",
              label: "Discard",
              variant: "secondary",
              disabled: createMutation.isPending,
              onClick: () => navigate("/sales/invoices"),
            },
          ]}
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <div>
          <p className="m-0 text-[0.875rem] font-[500] text-erp-muted">
            Customer Invoice
          </p>
          <h1 className="m-0 mb-[0.2em] mt-[0.2em] text-[2.1rem] font-[500] leading-tight text-erp-text">
            Draft
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
              <label className="text-base font-[500]" htmlFor="invoice-customer">
                Customer<span className="text-erp-error"> *</span>
              </label>
              <div className="max-w-sm">
                <FormDropdown
                  id="invoice-customer"
                  searchable
                  placeholder="Search customer..."
                  error={Boolean(errors.customer)}
                  disabled={customersQuery.isLoading}
                  value={customerUuid || null}
                  items={customerItems}
                  onChange={(key) => {
                    setValue("customer", key ?? "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    // Their agreed terms decide the due date; the user can
                    // still overrule it below.
                    const picked = customers.find((customer) => customer.uuid === key);
                    if (picked) {
                      setValue(
                        "due_date",
                        dueDateFrom(watch("issue_date"), picked.payment_terms_days),
                        { shouldDirty: true }
                      );
                    }
                  }}
                />
              </div>
            </div>
            {errors.customer ? (
              <p className="m-0 mt-1 text-[10px] text-erp-error">
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
              error={Boolean(errors.issue_date)}
              {...register("issue_date")}
            />
            <label className="font-[500] font-semibold" htmlFor="invoice-due-date">
              Due Date<span className="text-erp-error"> *</span>
            </label>
            <FormDatePicker
              id="invoice-due-date"
              error={Boolean(errors.due_date)}
              {...register("due_date")}
            />
          </div>
        </div>

        <Tabs
          items={detailTabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          aria-label="Invoice details"
        />

        {activeTab === "lines" ? (
          <div>
            <LineItemsTable<InvoiceLineFormValue>
              tableId="sales-invoice-create-lines"
              columns={lineColumns}
              rows={lines}
              onRowsChange={setLines}
              createEmptyRow={() => createEmptyInvoiceLine(defaultTax?.uuid ?? null)}
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
              <p className="m-0 mt-1.5 px-2 text-[10px] text-erp-error">{linesError}</p>
            ) : null}
            <div className="mt-0 flex justify-end px-2">
              <div className="w-68 border-t border-t-erp-muted pt-2">
                <dl className="m-0 mx-auto w-54">
                  <div className="flex items-center justify-between py-0.5">
                    <dt>Untaxed Amount:</dt>
                    <dd className="m-0 text-[1rem] font-[600]">
                      {formatMoney(untaxedEstimate.toFixed(2), currency)}
                    </dd>
                  </div>
                </dl>
                <p className="m-0 mt-2 text-[11px] text-erp-muted">
                  Tax and the total are calculated by the server when this draft is saved.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <FormSection title="Other info" className="border-b-0">
            <FormGrid columns={12}>
              <FormField
                label="Customer reference"
                htmlFor="invoice-customer-reference"
                span={6}
              >
                <FormInput
                  id="invoice-customer-reference"
                  {...register("customer_reference")}
                />
              </FormField>
              <FormField label="Discount type" htmlFor="invoice-discount-type" span={3}>
                <FormSelect
                  id="invoice-discount-type"
                  options={[
                    { label: "Percentage", value: "percentage" },
                    { label: "Fixed amount", value: "fixed" },
                  ]}
                  {...register("discount_type")}
                />
              </FormField>
              <FormField
                label="Discount"
                htmlFor="invoice-discount-value"
                error={errors.discount_value?.message}
                span={3}
              >
                <FormInput
                  id="invoice-discount-value"
                  inputMode="decimal"
                  error={Boolean(errors.discount_value)}
                  {...register("discount_value")}
                />
              </FormField>
              <FormField label="Terms and conditions" htmlFor="invoice-terms" span={12}>
                <FormTextarea id="invoice-terms" {...register("terms")} />
              </FormField>
              <FormField label="Notes" htmlFor="invoice-notes" span={12}>
                <FormTextarea id="invoice-notes" {...register("notes")} />
              </FormField>
            </FormGrid>
          </FormSection>
        )}
      </FormShell>
    </AppShell>
  );
}
