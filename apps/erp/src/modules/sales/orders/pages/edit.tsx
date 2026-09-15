/**
 * One order, against `/api/v1/sales/orders/<uuid>/`.
 *
 * The order's state decides what this page is. A draft is an editable
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
  useAcceptOrderMutation,
  useCancelOrderMutation,
  useConvertOrderMutation,
  useOrderQuery,
  useSendOrderMutation,
  useUpdateOrderMutation,
} from "../queries";
import { can, useTaxesQuery } from "@/modules/sales/shared";
import type { Order } from "../api";
import {
  ORDER_STATUS_LABELS,
  createEmptyOrderLine,
  emptyOrderForm,
  estimateLineAmount,
  estimateUntaxedTotal,
  formatMoney,
  hasChargeableLine,
  orderFormSchema,
  toFormLines,
  toLineInputs,
  type OrderFormValues,
  type OrderLineFormValue,
} from "@/modules/sales/orders/schema";
import { ApiError } from "@/lib/api-client";

const detailTabs = [
  { key: "lines", label: "Sale Lines" },
  { key: "other", label: "Other Info" },
];

/** A cancelled order gets its own last step; a live one never shows it. */
function stepsFor(status: Order["status"] | undefined): StatusStep[] {
  const steps: StatusStep[] = [
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Pending" },
    { key: "accepted", label: "Approved" },
  ];
  if (status === "cancelled") steps.push({ key: "cancelled", label: "Cancelled" });
  return steps;
}

export default function OrderEditPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useSalesNavbar("orders");
  const canEdit = can(session?.permissions, "sales.order", "edit");
  const canDelete = can(session?.permissions, "sales.order", "delete");

  const orderQuery = useOrderQuery(uuid);
  const order = orderQuery.data;
  const isDraft = order?.status === "draft";
  const isSent = order?.status === "sent";
  const isAccepted = order?.status === "accepted";
  const editable = Boolean(isDraft && canEdit);

  const updateMutation = useUpdateOrderMutation();
  const sendMutation = useSendOrderMutation();
  const acceptMutation = useAcceptOrderMutation();
  const cancelMutation = useCancelOrderMutation();
  const convertMutation = useConvertOrderMutation();

  const customersQuery = useCustomersQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });
  const taxesQuery = useTaxesQuery();

  const [activeTab, setActiveTab] = useState("lines");
  const [lines, setLines] = useState<OrderLineFormValue[]>([]);
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
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: emptyOrderForm(),
  });

  // Re-seed once the record arrives; until then the form holds its defaults.
  useEffect(() => {
    if (!order) return;
    reset({
      customer: order.customer.uuid,
      issue_date: order.issue_date,
      valid_until: order.valid_until,
      discount_type: order.discount_type,
      discount_value: order.discount_value,
      customer_reference: order.customer_reference,
      notes: order.notes,
      terms: order.terms,
    });
    setLines(
      order.lines.length > 0 ? toFormLines(order.lines) : [createEmptyOrderLine()]
    );
  }, [order, reset]);

  const currency = order?.currency ?? "";
  const untaxedEstimate = estimateUntaxedTotal(lines);

  const lineColumns: LineItemsColumn<OrderLineFormValue>[] = [
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
        if (field in orderFormSchema.shape) {
          setError(field as keyof OrderFormValues, { message: messages[0] });
        }
      }
    }
    toast({
      title: fallback,
      description: error instanceof ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function onSubmit(values: OrderFormValues) {
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

  /** What this order's state actually permits — nothing else is offered. */
  function statusActions(): FormStatusBarAction[] {
    if (!order) return [];
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
    if (canEdit && isAccepted && !order.converted_invoice) {
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

  const notFound = orderQuery.isError;
  const loading = orderQuery.isLoading;

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={
            <PageActions breadcrumb={order ? order.number || "Draft sale" : "Sale"} />
          }
        />

        {order ? (
          <FormStatusBar
            sticky={false}
            steps={stepsFor(order.status)}
            currentStepKey={order.status}
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
      ) : loading || !order ? (
        <p className="p-4 text-[12px] text-erp-muted">Loading sale…</p>
      ) : (
        <FormShell onSubmit={handleSubmit(onSubmit)}>
          <FormSection title="Sale details">
            <FormGrid columns={12}>
              <FormField
                label="Customer"
                required
                htmlFor="order-customer"
                error={errors.customer?.message}
                span={6}
              >
                <FormDropdown
                  id="order-customer"
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
                htmlFor="order-date"
                error={errors.issue_date?.message}
                span={3}
              >
                <FormDatePicker
                  id="order-date"
                  error={Boolean(errors.issue_date)}
                  disabled={!editable}
                  {...register("issue_date")}
                />
              </FormField>
              <FormField
                label="Valid until"
                required
                htmlFor="order-valid-until"
                error={errors.valid_until?.message}
                span={3}
              >
                <FormDatePicker
                  id="order-valid-until"
                  error={Boolean(errors.valid_until)}
                  disabled={!editable}
                  {...register("valid_until")}
                />
              </FormField>
              <FormField label="Status" span={3}>
                <div className="flex h-8 items-center gap-2">
                  <StatusBadge status={ORDER_STATUS_LABELS[order.status]} />
                </div>
              </FormField>
              {order.converted_invoice ? (
                <FormField label="Invoice" span={3}>
                  <div className="flex h-8 items-center">
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0 text-[12px] font-bold text-erp-brand-third hover:underline"
                      onClick={() =>
                        navigate(`/sales/invoices/${order.converted_invoice}/edit`)
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
                    <LineItemsTable<OrderLineFormValue>
                      tableId="sales-order-edit-lines"
                      columns={lineColumns}
                      rows={lines}
                      onRowsChange={setLines}
                      createEmptyRow={() =>
                        createEmptyOrderLine(
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
                      {order.lines.map((line) => (
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
                        {formatMoney(order.subtotal_amount, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="text-erp-muted">Discount</dt>
                      <dd className="m-0">
                        {formatMoney(order.discount_amount, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <dt className="text-erp-muted">Tax</dt>
                      <dd className="m-0">{formatMoney(order.tax_amount, currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-erp-border py-1">
                      <dt className="font-bold">Total</dt>
                      <dd className="m-0 text-[1.1rem] font-bold">
                        {formatMoney(order.total_amount, currency)}
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
                    htmlFor="order-customer-reference"
                    span={6}
                  >
                    <FormInput
                      id="order-customer-reference"
                      disabled={!editable}
                      {...register("customer_reference")}
                    />
                  </FormField>
                  <FormField label="Discount type" htmlFor="order-discount-type" span={3}>
                    <FormSelect
                      id="order-discount-type"
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
                    htmlFor="order-discount-value"
                    error={errors.discount_value?.message}
                    span={3}
                  >
                    <FormInput
                      id="order-discount-value"
                      inputMode="decimal"
                      disabled={!editable}
                      error={Boolean(errors.discount_value)}
                      {...register("discount_value")}
                    />
                  </FormField>
                  {/* Assigned by the backend from whoever raised it, so it is shown, not asked for. */}
                  <FormField label="Salesperson" span={6}>
                    <p className="m-0 flex h-8 items-center text-[12px] text-erp-text">
                      {order.salesperson_name ?? "—"}
                    </p>
                  </FormField>
                  <FormField label="Branch" span={6}>
                    <p className="m-0 flex h-8 items-center text-[12px] text-erp-text">
                      {order.branch?.name ?? "—"}
                    </p>
                  </FormField>
                  <FormField label="Terms and conditions" htmlFor="order-terms" span={12}>
                    <FormTextarea
                      id="order-terms"
                      disabled={!editable}
                      {...register("terms")}
                    />
                  </FormField>
                  <FormField label="Notes" htmlFor="order-notes" span={12}>
                    <FormTextarea
                      id="order-notes"
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
