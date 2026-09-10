/**
 * One invoice, against `/api/v1/sales/invoices/<uuid>/`.
 *
 * The invoice's state decides what this page is. A draft is an editable
 * document with one way out — posting it, which allocates its number. Once
 * posted it is a record: the fields are read-only, and the only things
 * left to do to it are taking payments and cancelling it. Controls the
 * state does not allow are not rendered at all.
 *
 * Every amount shown comes from the server. The line grid's own figures
 * are an estimate for the draft being typed, and are never sent back.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Printer } from "lucide-react";
import { AppShell, useNavbarDefaults } from "@/app";
import { useSession } from "@/app/session";
import {
  Button,
  ConfirmDialog,
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
  Modal,
  PageActions,
  StatusBadge,
  Tabs,
  Textarea,
  useToast,
  type DropdownItem,
  type FormStatusBarAction,
  type LineItemsColumn,
  type StatusStep,
} from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCustomersQuery } from "@/modules/sales/customers";
import {
  useCancelInvoiceMutation,
  useInvoiceQuery,
  usePaymentsQuery,
  usePostInvoiceMutation,
  useRecordPaymentMutation,
  useUpdateInvoiceMutation,
  useVoidPaymentMutation,
} from "../queries";
import { can, usePaymentMethodsQuery, useTaxesQuery } from "@/modules/sales/shared";
import type { Invoice } from "../api";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATE_LABELS,
  createEmptyInvoiceLine,
  emptyInvoiceForm,
  estimateLineAmount,
  estimateUntaxedTotal,
  formatMoney,
  hasChargeableLine,
  invoiceFormSchema,
  toFormLines,
  toLineInputs,
  todayIso,
  type InvoiceFormValues,
  type InvoiceLineFormValue,
} from "@/modules/sales/invoices/schema";
import { ApiError } from "@/lib/api-client";

const detailTabs = [
  { key: "lines", label: "Invoice Lines" },
  { key: "other", label: "Other Info" },
];

/** A cancelled invoice gets its own last step; a live one never shows it. */
function stepsFor(status: Invoice["status"] | undefined): StatusStep[] {
  const steps: StatusStep[] = [
    { key: "draft", label: "Draft" },
    { key: "posted", label: "Posted" },
  ];
  if (status === "cancelled") steps.push({ key: "cancelled", label: "Cancelled" });
  return steps;
}

interface PaymentDraft {
  amount: string;
  payment_method: string;
  payment_date: string;
  reference: string;
}

export default function InvoiceEditPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "invoices" });
  const canEdit = can(session?.permissions, "sales.invoice", "edit");
  const canDelete = can(session?.permissions, "sales.invoice", "delete");

  const invoiceQuery = useInvoiceQuery(uuid);
  const invoice = invoiceQuery.data;
  const isDraft = invoice?.status === "draft";
  const isPosted = invoice?.status === "posted";
  const editable = Boolean(isDraft && canEdit);

  const updateMutation = useUpdateInvoiceMutation();
  const postMutation = usePostInvoiceMutation();
  const cancelMutation = useCancelInvoiceMutation();
  const paymentMutation = useRecordPaymentMutation();
  const voidPaymentMutation = useVoidPaymentMutation();

  const customersQuery = useCustomersQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });
  const taxesQuery = useTaxesQuery();
  const paymentMethodsQuery = usePaymentMethodsQuery();
  // Only a posted invoice can have been paid; a draft has nothing to show.
  const paymentsQuery = usePaymentsQuery(uuid, invoice !== undefined && !isDraft);

  const [activeTab, setActiveTab] = useState("lines");
  const [lines, setLines] = useState<InvoiceLineFormValue[]>([]);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"post" | "cancel" | null>(null);
  const [payment, setPayment] = useState<PaymentDraft | null>(null);

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const taxes = useMemo(
    () => (taxesQuery.data?.data ?? []).filter((tax) => !tax.is_archived),
    [taxesQuery.data]
  );
  const paymentMethods = useMemo(
    () => (paymentMethodsQuery.data?.data ?? []).filter((method) => !method.is_archived),
    [paymentMethodsQuery.data]
  );

  const customerItems = useMemo<DropdownItem[]>(
    () => customers.map((customer) => ({ key: customer.uuid, label: customer.name })),
    [customers]
  );
  const taxItems = useMemo<DropdownItem[]>(
    () => taxes.map((tax) => ({ key: tax.uuid, label: `${tax.name} (${tax.rate}%)` })),
    [taxes]
  );
  const methodItems = useMemo<DropdownItem[]>(
    () => paymentMethods.map((method) => ({ key: method.uuid, label: method.name })),
    [paymentMethods]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: emptyInvoiceForm(),
  });

  // Re-seed once the record arrives; until then the form holds its defaults.
  useEffect(() => {
    if (!invoice) return;
    reset({
      customer: invoice.customer.uuid,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      discount_type: invoice.discount_type,
      discount_value: invoice.discount_value,
      customer_reference: invoice.customer_reference,
      notes: invoice.notes,
      terms: invoice.terms,
    });
    setLines(
      invoice.lines.length > 0 ? toFormLines(invoice.lines) : [createEmptyInvoiceLine()]
    );
  }, [invoice, reset]);

  const currency = invoice?.currency ?? "";
  const untaxedEstimate = estimateUntaxedTotal(lines);

  const lineColumns: LineItemsColumn<InvoiceLineFormValue>[] = [
    {
      key: "description",
      label: "Description",
      size: 340,
      minSize: 200,
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
      renderCell: (row, { onChange, onCommit }) => (
        // Text, not number: the API takes decimals as strings and a number
        // input would round what the user typed.
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
      label: "Unit Price",
      align: "end",
      size: 100,
      minSize: 80,
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

  function report(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.fields) {
      for (const [field, messages] of Object.entries(error.fields)) {
        if (field in invoiceFormSchema.shape) {
          setError(field as keyof InvoiceFormValues, { message: messages[0] });
        }
      }
    }
    toast({
      title: fallback,
      description: error instanceof ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function onSubmit(values: InvoiceFormValues) {
    if (!hasChargeableLine(lines)) {
      setLinesError("Add at least one line with a description.");
      setActiveTab("lines");
      return;
    }
    setLinesError(null);

    try {
      await updateMutation.mutateAsync({
        uuid,
        input: { ...values, lines: toLineInputs(lines) },
      });
      toast({ title: "Invoice saved", variant: "success" });
    } catch (error) {
      report(error, "Could not save the invoice");
    }
  }

  async function post() {
    try {
      await postMutation.mutateAsync(uuid);
      // The number the backend allocated arrives with the refetch this
      // mutation triggers, so the heading announces it rather than the toast.
      toast({
        title: "Invoice posted",
        description: "It has its number now and can no longer be edited.",
        variant: "success",
      });
      setConfirming(null);
    } catch (error) {
      report(error, "Could not post the invoice");
    }
  }

  async function cancel() {
    try {
      await cancelMutation.mutateAsync(uuid);
      toast({
        title: "Invoice cancelled",
        description: "Its number stays taken, which is what an audit expects.",
        variant: "success",
      });
      setConfirming(null);
    } catch (error) {
      report(error, "Could not cancel the invoice");
    }
  }

  async function recordPayment() {
    if (!payment) return;
    try {
      await paymentMutation.mutateAsync({
        uuid,
        input: {
          amount: payment.amount,
          payment_method: payment.payment_method,
          payment_date: payment.payment_date,
          reference: payment.reference,
        },
      });
      toast({ title: "Payment recorded", variant: "success" });
      setPayment(null);
    } catch (error) {
      toast({
        title: "Could not record the payment",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  async function voidPayment(paymentUuid: string) {
    try {
      await voidPaymentMutation.mutateAsync({ invoiceUuid: uuid, paymentUuid });
      toast({ title: "Payment voided", variant: "success" });
    } catch (error) {
      toast({
        title: "Could not void the payment",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  /** What this invoice's state actually permits — nothing else is offered. */
  function statusActions(): FormStatusBarAction[] {
    if (!invoice) return [];
    if (isDraft) {
      const actions: FormStatusBarAction[] = [];
      if (canEdit) {
        actions.push(
          {
            key: "save",
            label: "Save",
            variant: "primary",
            loading: updateMutation.isPending,
            onClick: handleSubmit(onSubmit),
          },
          {
            key: "post",
            label: "Post",
            variant: "teal",
            loading: postMutation.isPending,
            onClick: () => setConfirming("post"),
          }
        );
      }
      actions.push({
        key: "back",
        label: "Back",
        variant: "secondary",
        onClick: () => navigate("/sales/invoices"),
      });
      return actions;
    }
    const actions: FormStatusBarAction[] = [];
    if (canEdit && isPosted && invoice.payment_status !== "paid") {
      actions.push({
        key: "pay",
        label: "Record payment",
        variant: "primary",
        onClick: () =>
          setPayment({
            amount: invoice.balance_amount,
            payment_method:
              paymentMethods.find((method) => method.is_default)?.uuid ??
              paymentMethods[0]?.uuid ??
              "",
            payment_date: todayIso(),
            reference: "",
          }),
      });
    }
    if (canDelete && isPosted) {
      actions.push({
        key: "cancel-invoice",
        label: "Cancel invoice",
        variant: "danger",
        loading: cancelMutation.isPending,
        onClick: () => setConfirming("cancel"),
      });
    }
    actions.push({
      key: "back",
      label: "Back",
      variant: "secondary",
      onClick: () => navigate("/sales/invoices"),
    });
    return actions;
  }

  const notFound = invoiceQuery.isError;
  const loading = invoiceQuery.isLoading;

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={
            <PageActions
              breadcrumb={invoice ? invoice.number || "Draft invoice" : "Invoice"}
              buttons={
                invoice
                  ? [
                      {
                        key: "print",
                        variant: "secondary",
                        size: "sm",
                        onClick: () => navigate(`/sales/invoices/${uuid}/print`),
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

        {invoice ? (
          <FormStatusBar
            sticky={false}
            steps={stepsFor(invoice.status)}
            currentStepKey={invoice.status}
            actions={statusActions()}
          />
        ) : null}
      </FormStickyHeader>

      {notFound ? (
        <div className="rounded-[10px] border border-erp-border bg-erp-surface p-4 text-[12px] text-erp-muted">
          <p className="m-0 font-bold text-erp-text">Invoice not found</p>
          <p className="mb-0 mt-1">
            It may have been deleted, or belong to a branch you cannot reach.{" "}
            <button
              type="button"
              className="font-bold text-erp-brand-third hover:underline"
              onClick={() => navigate("/sales/invoices")}
            >
              Back to invoices
            </button>
          </p>
        </div>
      ) : loading || !invoice ? (
        <p className="p-4 text-[12px] text-erp-muted">Loading invoice…</p>
      ) : (
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
                  disabled={!editable}
                  value={watch("customer") || null}
                  items={customerItems}
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
                error={errors.issue_date?.message}
                span={3}
              >
                <FormDatePicker
                  id="invoice-date"
                  error={Boolean(errors.issue_date)}
                  disabled={!editable}
                  {...register("issue_date")}
                />
              </FormField>
              <FormField
                label="Due date"
                required
                htmlFor="invoice-due-date"
                error={errors.due_date?.message}
                span={3}
              >
                <FormDatePicker
                  id="invoice-due-date"
                  error={Boolean(errors.due_date)}
                  disabled={!editable}
                  {...register("due_date")}
                />
              </FormField>
              <FormField label="Status" span={3}>
                <div className="flex h-8 items-center gap-2">
                  <StatusBadge status={INVOICE_STATUS_LABELS[invoice.status]} />
                  <StatusBadge status={PAYMENT_STATE_LABELS[invoice.payment_status]} />
                </div>
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
              <FormSection title="Invoice lines" className="border-b-0">
                {editable ? (
                  <>
                    <LineItemsTable<InvoiceLineFormValue>
                      tableId="sales-invoice-edit-lines"
                      columns={lineColumns}
                      rows={lines}
                      onRowsChange={setLines}
                      createEmptyRow={() =>
                        createEmptyInvoiceLine(
                          taxes.find((tax) => tax.is_default)?.uuid ?? null
                        )
                      }
                      aria-label="Invoice lines"
                    />
                    {linesError ? (
                      <p className="m-0 mt-1.5 px-2 text-[10px] text-erp-error">
                        {linesError}
                      </p>
                    ) : null}
                    <p className="m-0 mt-2 px-2 text-[11px] text-erp-muted">
                      Untaxed, as typed:{" "}
                      {formatMoney(untaxedEstimate.toFixed(2), currency)}. The totals
                      below are the server's, recalculated on save.
                    </p>
                  </>
                ) : (
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b border-erp-border text-erp-subtle">
                        <th className="py-1.5 text-left font-bold">Description</th>
                        <th className="py-1.5 text-right font-bold">Quantity</th>
                        <th className="py-1.5 text-right font-bold">Unit price</th>
                        <th className="py-1.5 text-right font-bold">Tax</th>
                        <th className="py-1.5 text-right font-bold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line) => (
                        <tr key={line.uuid} className="border-b border-erp-border">
                          <td
                            className={
                              line.kind === "product"
                                ? "py-1.5"
                                : "py-1.5 font-bold text-erp-subtle"
                            }
                          >
                            {line.description}
                          </td>
                          {line.kind === "product" ? (
                            <>
                              <td className="py-1.5 text-right">{line.quantity}</td>
                              <td className="py-1.5 text-right">{line.unit_price}</td>
                              <td className="py-1.5 text-right">{line.tax_rate}%</td>
                              <td className="py-1.5 text-right font-bold">
                                {formatMoney(line.line_total, currency)}
                              </td>
                            </>
                          ) : (
                            <td colSpan={4} />
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="mt-2 flex justify-end px-2">
                  <dl className="m-0 w-64 text-[12px]">
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="text-erp-muted">Subtotal</dt>
                      <dd className="m-0">
                        {formatMoney(invoice.subtotal_amount, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="text-erp-muted">Discount</dt>
                      <dd className="m-0">
                        {formatMoney(invoice.discount_amount, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="text-erp-muted">Tax</dt>
                      <dd className="m-0">{formatMoney(invoice.tax_amount, currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-erp-border py-1">
                      <dt className="font-bold">Total</dt>
                      <dd className="m-0 text-[1.1rem] font-bold">
                        {formatMoney(invoice.total_amount, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="text-erp-muted">Paid</dt>
                      <dd className="m-0">
                        {formatMoney(invoice.paid_amount, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="font-bold">Balance due</dt>
                      <dd className="m-0 font-bold">
                        {formatMoney(invoice.balance_amount, currency)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {!isDraft && paymentsQuery.data && paymentsQuery.data.length > 0 ? (
                  <div className="mt-4">
                    <p className="m-0 mb-1 text-[12px] font-bold text-erp-text">
                      Payments
                    </p>
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="border-b border-erp-border text-erp-subtle">
                          <th className="py-1.5 text-left font-bold">Date</th>
                          <th className="py-1.5 text-left font-bold">Method</th>
                          <th className="py-1.5 text-left font-bold">Reference</th>
                          <th className="py-1.5 text-right font-bold">Amount</th>
                          {canEdit ? (
                            <th className="py-1.5 text-right font-bold"> </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {paymentsQuery.data.map((entry) => (
                          <tr key={entry.uuid} className="border-b border-erp-border">
                            <td className="py-1.5">{entry.payment_date}</td>
                            <td className="py-1.5">{entry.payment_method}</td>
                            <td className="py-1.5">{entry.reference || "—"}</td>
                            <td className="py-1.5 text-right">
                              {/* A voided payment stays on the record; it just stops counting. */}
                              {entry.voided_at ? (
                                <span className="text-erp-muted line-through">
                                  {formatMoney(entry.amount, currency)}
                                </span>
                              ) : (
                                formatMoney(entry.amount, currency)
                              )}
                            </td>
                            {canEdit ? (
                              <td className="py-1.5 text-right">
                                {!entry.voided_at ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    loading={voidPaymentMutation.isPending}
                                    onClick={() => void voidPayment(entry.uuid)}
                                  >
                                    Void payment
                                  </Button>
                                ) : null}
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </FormSection>
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
                      disabled={!editable}
                      {...register("customer_reference")}
                    />
                  </FormField>
                  <FormField
                    label="Discount type"
                    htmlFor="invoice-discount-type"
                    span={3}
                  >
                    <FormSelect
                      id="invoice-discount-type"
                      disabled={!editable}
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
                      disabled={!editable}
                      error={Boolean(errors.discount_value)}
                      {...register("discount_value")}
                    />
                  </FormField>
                  {/* Assigned by the backend from whoever raised it, so it is shown, not asked for. */}
                  <FormField label="Salesperson" span={6}>
                    <p className="m-0 flex h-8 items-center text-[12px] text-erp-text">
                      {invoice.salesperson_name ?? "—"}
                    </p>
                  </FormField>
                  <FormField label="Branch" span={6}>
                    <p className="m-0 flex h-8 items-center text-[12px] text-erp-text">
                      {invoice.branch?.name ?? "—"}
                    </p>
                  </FormField>
                  <FormField
                    label="Terms and conditions"
                    htmlFor="invoice-terms"
                    span={12}
                  >
                    <FormTextarea
                      id="invoice-terms"
                      disabled={!editable}
                      {...register("terms")}
                    />
                  </FormField>
                  <FormField label="Notes" htmlFor="invoice-notes" span={12}>
                    <FormTextarea
                      id="invoice-notes"
                      disabled={!editable}
                      {...register("notes")}
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
            )}
          </div>
        </FormShell>
      )}

      <ConfirmDialog
        open={confirming === "post"}
        title="Post this invoice?"
        description="Posting issues it: the invoice takes the next number and stops being editable."
        confirmLabel="Post"
        loading={postMutation.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => void post()}
      />

      <ConfirmDialog
        open={confirming === "cancel"}
        title="Cancel this invoice?"
        description="It stays on file under its own number — a gap in the numbering is what an auditor expects to see."
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
        variant="danger"
        loading={cancelMutation.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => void cancel()}
      />

      <Modal
        open={payment !== null}
        onClose={() => setPayment(null)}
        title="Record a payment"
        description={
          invoice
            ? `Balance due ${formatMoney(invoice.balance_amount, currency)}.`
            : undefined
        }
        footer={
          <>
            <Button
              variant="secondary"
              disabled={paymentMutation.isPending}
              onClick={() => setPayment(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={paymentMutation.isPending}
              disabled={!payment?.amount || !payment.payment_method}
              onClick={() => void recordPayment()}
            >
              Record payment
            </Button>
          </>
        }
      >
        {payment ? (
          <FormGrid columns={12}>
            <FormField label="Amount" required htmlFor="payment-amount" span={6}>
              <FormInput
                id="payment-amount"
                inputMode="decimal"
                value={payment.amount}
                onChange={(event) =>
                  setPayment({ ...payment, amount: event.target.value })
                }
              />
            </FormField>
            <FormField label="Date" required htmlFor="payment-date" span={6}>
              <FormDatePicker
                id="payment-date"
                value={payment.payment_date}
                onChange={(event) =>
                  setPayment({ ...payment, payment_date: event.target.value })
                }
              />
            </FormField>
            <FormField label="Method" required htmlFor="payment-method" span={6}>
              <FormDropdown
                id="payment-method"
                placeholder="Choose a method"
                value={payment.payment_method || null}
                items={methodItems}
                onChange={(key) => setPayment({ ...payment, payment_method: key ?? "" })}
              />
            </FormField>
            <FormField label="Reference" htmlFor="payment-reference" span={6}>
              <FormInput
                id="payment-reference"
                value={payment.reference}
                onChange={(event) =>
                  setPayment({ ...payment, reference: event.target.value })
                }
              />
            </FormField>
          </FormGrid>
        ) : null}
      </Modal>
    </AppShell>
  );
}
