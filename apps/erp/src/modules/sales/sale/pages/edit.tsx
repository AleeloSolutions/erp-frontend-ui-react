/**
 * One sale, against `/api/v1/sales/<uuid>/`.
 *
 * The sale's state decides what this page is. A draft is an editable
 * document with one way out — sending it, which allocates its number. Once
 * sent it is a record: the fields are read-only, and the only things left
 * to do are accepting it or cancelling it. Controls the state does not
 * allow are not rendered at all.
 *
 * Every amount shown comes from the server. The line grid's own figures
 * are an estimate for the draft being typed, and are never sent back.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import {
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
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { useCustomersQuery } from "@/modules/sales/customers";
import {
  useAcceptSaleMutation,
  useCancelSaleMutation,
  useConvertSaleMutation,
  useSaleQuery,
  useSendSaleMutation,
  useUpdateSaleMutation,
} from "../queries";
import { can, useTaxesQuery } from "@/modules/sales/shared";
import type { Sale } from "../api";
import {
  SALE_STATUS_LABELS,
  createEmptySaleLine,
  emptySaleForm,
  estimateLineAmount,
  estimateUntaxedTotal,
  formatMoney,
  hasChargeableLine,
  saleFormSchema,
  toFormLines,
  toLineInputs,
  type SaleFormValues,
  type SaleLineFormValue,
} from "@/modules/sales/sale/schema";
import { ApiError } from "@/lib/api-client";

const detailTabs = [
  { key: "lines", label: "Sale Lines" },
  { key: "other", label: "Other Info" },
];

/** A cancelled sale gets its own last step; a live one never shows it. */
function stepsFor(status: Sale["status"] | undefined): StatusStep[] {
  const steps: StatusStep[] = [
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Pending" },
    { key: "accepted", label: "Approved" },
  ];
  if (status === "cancelled") steps.push({ key: "cancelled", label: "Cancelled" });
  return steps;
}

export default function SaleEditPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useSalesNavbar("sales");
  const canEdit = can(session?.permissions, "sales.sale", "edit");
  const canDelete = can(session?.permissions, "sales.sale", "delete");

  const saleQuery = useSaleQuery(uuid);
  const sale = saleQuery.data;
  const isDraft = sale?.status === "draft";
  const isSent = sale?.status === "sent";
  const isAccepted = sale?.status === "accepted";
  const editable = Boolean(isDraft && canEdit);

  const updateMutation = useUpdateSaleMutation();
  const sendMutation = useSendSaleMutation();
  const acceptMutation = useAcceptSaleMutation();
  const cancelMutation = useCancelSaleMutation();
  const convertMutation = useConvertSaleMutation();

  const customersQuery = useCustomersQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });
  const taxesQuery = useTaxesQuery();

  const [activeTab, setActiveTab] = useState("lines");
  const [lines, setLines] = useState<SaleLineFormValue[]>([]);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<
    "send" | "accept" | "cancel" | "convert" | null
  >(null);

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const taxes = useMemo(
    () => (taxesQuery.data?.data ?? []).filter((tax) => !tax.is_archived),
    [taxesQuery.data]
  );

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
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: emptySaleForm(),
  });

  // Re-seed once the record arrives; until then the form holds its defaults.
  useEffect(() => {
    if (!sale) return;
    reset({
      customer: sale.customer.uuid,
      issue_date: sale.issue_date,
      valid_until: sale.valid_until,
      discount_type: sale.discount_type,
      discount_value: sale.discount_value,
      customer_reference: sale.customer_reference,
      notes: sale.notes,
      terms: sale.terms,
    });
    setLines(sale.lines.length > 0 ? toFormLines(sale.lines) : [createEmptySaleLine()]);
  }, [sale, reset]);

  const currency = sale?.currency ?? "";
  const untaxedEstimate = estimateUntaxedTotal(lines);

  const lineColumns: LineItemsColumn<SaleLineFormValue>[] = [
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
          placeholder="What is being quoted"
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
        if (field in saleFormSchema.shape) {
          setError(field as keyof SaleFormValues, { message: messages[0] });
        }
      }
    }
    toast({
      title: fallback,
      description: error instanceof ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function onSubmit(values: SaleFormValues) {
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
      toast({ title: "Sale saved", variant: "success" });
    } catch (error) {
      report(error, "Could not save the sale");
    }
  }

  async function send() {
    try {
      await sendMutation.mutateAsync(uuid);
      // The number the backend allocated arrives with the refetch this
      // mutation triggers, so the heading announces it rather than the toast.
      toast({
        title: "Sale sent",
        description: "It has its number now and can no longer be edited.",
        variant: "success",
      });
      setConfirming(null);
    } catch (error) {
      report(error, "Could not send the sale");
    }
  }

  async function accept() {
    try {
      await acceptMutation.mutateAsync(uuid);
      toast({
        title: "Sale accepted",
        description: "The customer has approved this sale.",
        variant: "success",
      });
      setConfirming(null);
    } catch (error) {
      report(error, "Could not accept the sale");
    }
  }

  async function cancel() {
    try {
      await cancelMutation.mutateAsync(uuid);
      toast({
        title: "Sale cancelled",
        description: "Its number stays taken, which is what an audit expects.",
        variant: "success",
      });
      setConfirming(null);
    } catch (error) {
      report(error, "Could not cancel the sale");
    }
  }

  async function convert() {
    try {
      const invoice = await convertMutation.mutateAsync(uuid);
      setConfirming(null);
      toast({
        title: "Invoice created",
        description: "A draft invoice was created from this sale's lines.",
        variant: "success",
      });
      navigate(`/sales/invoices/${invoice.uuid}/edit`);
    } catch (error) {
      report(error, "Could not create an invoice from this sale");
    }
  }

  /** What this sale's state actually permits — nothing else is offered. */
  function statusActions(): FormStatusBarAction[] {
    if (!sale) return [];
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
            key: "send",
            label: "Send",
            variant: "teal",
            loading: sendMutation.isPending,
            onClick: () => setConfirming("send"),
          }
        );
      }
      actions.push({
        key: "back",
        label: "Back",
        variant: "secondary",
        onClick: () => navigate("/sales"),
      });
      return actions;
    }
    const actions: FormStatusBarAction[] = [];
    if (canEdit && isSent) {
      actions.push({
        key: "accept",
        label: "Accept",
        variant: "primary",
        loading: acceptMutation.isPending,
        onClick: () => setConfirming("accept"),
      });
    }
    if (canEdit && isAccepted && !sale.converted_invoice) {
      actions.push({
        key: "convert",
        label: "Create invoice",
        variant: "teal",
        loading: convertMutation.isPending,
        onClick: () => setConfirming("convert"),
      });
    }
    if (canDelete && (isSent || isAccepted)) {
      actions.push({
        key: "cancel-sale",
        label: "Cancel sale",
        variant: "danger",
        loading: cancelMutation.isPending,
        onClick: () => setConfirming("cancel"),
      });
    }
    actions.push({
      key: "back",
      label: "Back",
      variant: "secondary",
      onClick: () => navigate("/sales"),
    });
    return actions;
  }

  const notFound = saleQuery.isError;
  const loading = saleQuery.isLoading;

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={
            <PageActions breadcrumb={sale ? sale.number || "Draft sale" : "Sale"} />
          }
        />

        {sale ? (
          <FormStatusBar
            sticky={false}
            steps={stepsFor(sale.status)}
            currentStepKey={sale.status}
            actions={statusActions()}
          />
        ) : null}
      </FormStickyHeader>

      {notFound ? (
        <div className="rounded-[10px] border border-erp-border bg-erp-surface p-4 text-[12px] text-erp-muted">
          <p className="m-0 font-bold text-erp-text">Sale not found</p>
          <p className="mb-0 mt-1">
            It may have been deleted, or belong to a branch you cannot reach.{" "}
            <button
              type="button"
              className="font-bold text-erp-brand-third hover:underline"
              onClick={() => navigate("/sales")}
            >
              Back to sales
            </button>
          </p>
        </div>
      ) : loading || !sale ? (
        <p className="p-4 text-[12px] text-erp-muted">Loading sale…</p>
      ) : (
        <FormShell onSubmit={handleSubmit(onSubmit)}>
          <FormSection title="Sale details">
            <FormGrid columns={12}>
              <FormField
                label="Customer"
                required
                htmlFor="sale-customer"
                error={errors.customer?.message}
                span={6}
              >
                <FormDropdown
                  id="sale-customer"
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
                label="Sale date"
                required
                htmlFor="sale-date"
                error={errors.issue_date?.message}
                span={3}
              >
                <FormDatePicker
                  id="sale-date"
                  error={Boolean(errors.issue_date)}
                  disabled={!editable}
                  {...register("issue_date")}
                />
              </FormField>
              <FormField
                label="Valid until"
                required
                htmlFor="sale-valid-until"
                error={errors.valid_until?.message}
                span={3}
              >
                <FormDatePicker
                  id="sale-valid-until"
                  error={Boolean(errors.valid_until)}
                  disabled={!editable}
                  {...register("valid_until")}
                />
              </FormField>
              <FormField label="Status" span={3}>
                <div className="flex h-8 items-center gap-2">
                  <StatusBadge status={SALE_STATUS_LABELS[sale.status]} />
                </div>
              </FormField>
              {sale.converted_invoice ? (
                <FormField label="Invoice" span={3}>
                  <div className="flex h-8 items-center">
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0 text-[12px] font-bold text-erp-brand-third hover:underline"
                      onClick={() =>
                        navigate(`/sales/invoices/${sale.converted_invoice}/edit`)
                      }
                    >
                      View invoice
                    </button>
                  </div>
                </FormField>
              ) : null}
            </FormGrid>
          </FormSection>

          <div>
            <Tabs
              items={detailTabs}
              activeKey={activeTab}
              onChange={setActiveTab}
              aria-label="Sale details"
            />

            {activeTab === "lines" ? (
              <FormSection title="Sale lines" className="border-b-0">
                {editable ? (
                  <>
                    <LineItemsTable<SaleLineFormValue>
                      tableId="sales-sale-edit-lines"
                      columns={lineColumns}
                      rows={lines}
                      onRowsChange={setLines}
                      createEmptyRow={() =>
                        createEmptySaleLine(
                          taxes.find((tax) => tax.is_default)?.uuid ?? null
                        )
                      }
                      aria-label="Sale lines"
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
                      {sale.lines.map((line) => (
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
                        {formatMoney(sale.subtotal_amount, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="text-erp-muted">Discount</dt>
                      <dd className="m-0">
                        {formatMoney(sale.discount_amount, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="text-erp-muted">Tax</dt>
                      <dd className="m-0">{formatMoney(sale.tax_amount, currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-erp-border py-1">
                      <dt className="font-bold">Total</dt>
                      <dd className="m-0 text-[1.1rem] font-bold">
                        {formatMoney(sale.total_amount, currency)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </FormSection>
            ) : (
              <FormSection title="Other info" className="border-b-0">
                <FormGrid columns={12}>
                  <FormField
                    label="Customer reference"
                    htmlFor="sale-customer-reference"
                    span={6}
                  >
                    <FormInput
                      id="sale-customer-reference"
                      disabled={!editable}
                      {...register("customer_reference")}
                    />
                  </FormField>
                  <FormField label="Discount type" htmlFor="sale-discount-type" span={3}>
                    <FormSelect
                      id="sale-discount-type"
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
                    htmlFor="sale-discount-value"
                    error={errors.discount_value?.message}
                    span={3}
                  >
                    <FormInput
                      id="sale-discount-value"
                      inputMode="decimal"
                      disabled={!editable}
                      error={Boolean(errors.discount_value)}
                      {...register("discount_value")}
                    />
                  </FormField>
                  {/* Assigned by the backend from whoever raised it, so it is shown, not asked for. */}
                  <FormField label="Salesperson" span={6}>
                    <p className="m-0 flex h-8 items-center text-[12px] text-erp-text">
                      {sale.salesperson_name ?? "—"}
                    </p>
                  </FormField>
                  <FormField label="Branch" span={6}>
                    <p className="m-0 flex h-8 items-center text-[12px] text-erp-text">
                      {sale.branch?.name ?? "—"}
                    </p>
                  </FormField>
                  <FormField label="Terms and conditions" htmlFor="sale-terms" span={12}>
                    <FormTextarea
                      id="sale-terms"
                      disabled={!editable}
                      {...register("terms")}
                    />
                  </FormField>
                  <FormField label="Notes" htmlFor="sale-notes" span={12}>
                    <FormTextarea
                      id="sale-notes"
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
        open={confirming === "send"}
        title="Send this sale?"
        description="Sending issues it: the sale takes the next number and stops being editable."
        confirmLabel="Send"
        loading={sendMutation.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => void send()}
      />

      <ConfirmDialog
        open={confirming === "accept"}
        title="Accept this sale?"
        description="This marks the sale as approved by the customer."
        confirmLabel="Accept"
        loading={acceptMutation.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => void accept()}
      />

      <ConfirmDialog
        open={confirming === "convert"}
        title="Create an invoice from this sale?"
        description="A draft invoice is created with the same customer, lines, and terms. You can edit it before posting."
        confirmLabel="Create invoice"
        loading={convertMutation.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => void convert()}
      />

      <ConfirmDialog
        open={confirming === "cancel"}
        title="Cancel this sale?"
        description="It stays on file under its own number — a gap in the numbering is what an auditor expects to see."
        confirmLabel="Cancel sale"
        cancelLabel="Keep it"
        variant="danger"
        loading={cancelMutation.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => void cancel()}
      />
    </AppShell>
  );
}
