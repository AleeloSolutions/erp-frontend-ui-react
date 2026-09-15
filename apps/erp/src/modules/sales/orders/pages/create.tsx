/**
 * New order, against `/api/v1/sales/orders/`.
 *
 * A new order is always a draft: `POST` stores it, and only sending it
 * later allocates a number. Nothing here computes what will be charged —
 * the amounts beside the lines are the editor's own estimate, shown so the
 * page is not blank while the draft is typed, and they are replaced by the
 * server's figures the moment it is saved.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import {
  Button,
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
  Tabs,
  Textarea,
  useToast,
  type DropdownItem,
  type LineItemsColumn,
  type LineItemsRowHelpers,
  type LineItemsSpecialRow,
  type StatusStep,
} from "@erp/ui";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { useCreateCustomerMutation, useCustomersQuery } from "@/modules/sales/customers";
import { useCreateProductMutation, useProductsQuery } from "@/modules/sales/products";
import { useCreateOrderMutation } from "../queries";
import { can, useSalesSettingsQuery, useTaxesQuery } from "@/modules/sales/shared";
import {
  createEmptyOrderLine,
  createOrderNoteLine,
  createOrderSectionLine,
  emptyOrderForm,
  estimateLineAmount,
  estimateUntaxedTotal,
  formatMoney,
  hasChargeableLine,
  orderFormSchema,
  toLineInputs,
  validUntilFrom,
  type OrderFormValues,
  type OrderLineFormValue,
} from "@/modules/sales/orders/schema";
import { ApiError } from "@/lib/api-client";

/** Read-only until it is saved and sent — sending is its own action. */
const statusSteps: StatusStep[] = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Pending" },
];

const detailTabs = [
  { key: "lines", label: "Sale Lines" },
  { key: "other", label: "Other Info" },
];

/** Odoo behaviour: a section subtotals every product row below it, down to the next section. */
function sectionEstimate(
  sectionLine: OrderLineFormValue,
  allLines: OrderLineFormValue[]
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

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useSalesNavbar("orders");
  const createMutation = useCreateOrderMutation();
  const canCreate = can(session?.permissions, "sales.order", "create");

  useEffect(() => {
    if (session && !canCreate) {
      navigate("/sales", { replace: true });
    }
  }, [session, canCreate, navigate]);

  const [activeTab, setActiveTab] = useState("lines");
  const [lines, setLines] = useState<OrderLineFormValue[]>([createEmptyOrderLine()]);
  const [linesError, setLinesError] = useState<string | null>(null);

  // One page of customers feeds the picker; the Dropdown filters what it
  // was given, so a tenant past this many needs a server-backed search.
  const customersQuery = useCustomersQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });
  const createCustomerMutation = useCreateCustomerMutation();
  const productsQuery = useProductsQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });
  const createProductMutation = useCreateProductMutation();
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerModalName, setCustomerModalName] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalName, setProductModalName] = useState("");
  const productLineTarget = useRef<string | null>(null);
  const taxesQuery = useTaxesQuery();
  const settingsQuery = useSalesSettingsQuery();
  const settings = settingsQuery.data;

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);
  const taxes = useMemo(
    () => (taxesQuery.data?.data ?? []).filter((tax) => !tax.is_archived),
    [taxesQuery.data]
  );
  const defaultTax = taxes.find((tax) => tax.is_default) ?? null;
  const defaultValidDays = settings?.default_order_valid_days ?? 30;

  const customerItems = useMemo<DropdownItem[]>(
    () => customers.map((customer) => ({ key: customer.uuid, label: customer.name })),
    [customers]
  );
  const productItems = useMemo<DropdownItem[]>(
    () => products.map((product) => ({ key: product.name, label: product.name })),
    [products]
  );
  const taxItems = useMemo<DropdownItem[]>(
    () => taxes.map((tax) => ({ key: tax.uuid, label: `${tax.name} (${tax.rate}%)` })),
    [taxes]
  );

  async function ensureCustomer(nameOrUuid: string): Promise<string | null> {
    const trimmed = nameOrUuid.trim();
    if (!trimmed) return null;
    const existing = customers.find(
      (customer) =>
        customer.uuid === trimmed || customer.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing.uuid;
    try {
      const created = await createCustomerMutation.mutateAsync({ name: trimmed });
      toast({ title: "Customer created", variant: "success" });
      await customersQuery.refetch();
      return created.uuid;
    } catch (err) {
      toast({
        title: "Could not create the customer",
        description: err instanceof ApiError ? err.message : "Please try again.",
        variant: "error",
      });
      return null;
    }
  }

  async function applyProductToLine(
    _lineId: string,
    nameOrUuid: string,
    onChange: (patch: Partial<OrderLineFormValue>) => void
  ) {
    const trimmed = nameOrUuid.trim();
    if (!trimmed) return;
    let product = products.find(
      (row) => row.uuid === trimmed || row.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!product) {
      try {
        product = await createProductMutation.mutateAsync({ name: trimmed });
        toast({ title: "Product created", variant: "success" });
        await productsQuery.refetch();
      } catch (err) {
        toast({
          title: "Could not create the product",
          description: err instanceof ApiError ? err.message : "Please try again.",
          variant: "error",
        });
        onChange({ description: trimmed });
        return;
      }
    }
    onChange({
      description: product.name,
      unit_price: product.unit_price || "0.00",
      tax: product.default_tax ?? defaultTax?.uuid ?? null,
    });
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: emptyOrderForm(),
  });

  const customerUuid = watch("customer");
  const selectedCustomer = customers.find((customer) => customer.uuid === customerUuid);
  const currency = selectedCustomer?.currency ?? "";

  // Tenant defaults arrive after the first render; seed valid-until and terms
  // into the untouched form rather than making them a manual step.
  const settingsSeeded = useRef(false);
  useEffect(() => {
    if (!settings || settingsSeeded.current) return;
    settingsSeeded.current = true;
    setValue(
      "valid_until",
      validUntilFrom(watch("issue_date"), settings.default_order_valid_days ?? 30)
    );
    if (settings.invoice_terms) {
      setValue("terms", settings.invoice_terms);
    }
  }, [settings, setValue, watch]);

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

  const lineColumns: LineItemsColumn<OrderLineFormValue>[] = [
    {
      key: "description",
      label: "Product",
      size: 340,
      minSize: 200,
      maxSize: 560,
      renderCell: (row, { onChange, onCommit }) =>
        row.kind === "product" ? (
          <FormDropdown
            id={`line-product-${row.id}`}
            searchable
            allowFreeText
            chrome="cell"
            placeholder="Search or type a product…"
            value={row.description || null}
            items={productItems}
            onChange={(key) => {
              if (!key) {
                onChange({ description: "" });
                onCommit();
                return;
              }
              void applyProductToLine(row.id, key, onChange).then(onCommit);
            }}
          />
        ) : (
          <Textarea
            autoGrow
            chrome="cell"
            value={row.description}
            placeholder="Section or note"
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

  function getOrderSpecialRow(
    row: OrderLineFormValue,
    { onChange, onCommit }: LineItemsRowHelpers<OrderLineFormValue>
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

  async function onSubmit(values: OrderFormValues) {
    if (!hasChargeableLine(lines)) {
      setLinesError("Add at least one line with a description.");
      setActiveTab("lines");
      return;
    }
    setLinesError(null);

    try {
      const order = await createMutation.mutateAsync({
        ...values,
        lines: toLineInputs(lines),
      });
      toast({
        title: "Draft sale created",
        description: "It gets its number when you send it.",
        variant: "success",
      });
      // Straight to the record: sending, and the server's real totals, live there.
      navigate(`/sales/${order.uuid}/edit`);
    } catch (error) {
      // The API owns the rules the form cannot know — a customer over their
      // credit limit, a tax that no longer applies.
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field in orderFormSchema.shape) {
            setError(field as keyof OrderFormValues, { message: messages[0] });
          }
        }
      }
      toast({
        title: "Could not create the sale",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  if (session && !canCreate) {
    return null;
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={<PageActions breadcrumb="New Sale" />}
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
              onClick: () => navigate("/sales"),
            },
          ]}
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <div>
          <p className="m-0 text-[0.875rem] font-[500] text-erp-muted">Sale</p>
          <h1 className="m-0 mb-[0.2em] mt-[0.2em] text-[2.1rem] font-[500] leading-tight text-erp-text">
            Draft
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2">
              <label className="text-base font-[500]" htmlFor="order-customer">
                Customer<span className="text-erp-error"> *</span>
              </label>
              <div className="max-w-sm">
                <FormDropdown
                  id="order-customer"
                  searchable
                  allowFreeText
                  placeholder="Search or type a customer…"
                  error={Boolean(errors.customer)}
                  disabled={customersQuery.isLoading || createCustomerMutation.isPending}
                  value={customerUuid || null}
                  items={customerItems}
                  onChange={(key) => {
                    void (async () => {
                      if (!key) {
                        setValue("customer", "", {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        return;
                      }
                      const uuid = await ensureCustomer(key);
                      if (!uuid) return;
                      setValue("customer", uuid, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue(
                        "valid_until",
                        validUntilFrom(watch("issue_date"), defaultValidDays),
                        { shouldDirty: true }
                      );
                    })();
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomerModalName("");
                  setCustomerModalOpen(true);
                }}
              >
                New
              </Button>
            </div>
            {errors.customer ? (
              <p className="m-0 mt-1 text-[10px] text-erp-error">
                {errors.customer.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5">
            <label className="font-semibold" htmlFor="order-date">
              Sale date<span className="text-erp-error"> *</span>
            </label>
            <FormDatePicker
              id="order-date"
              error={Boolean(errors.issue_date)}
              {...register("issue_date")}
            />
            <label className="font-[500] font-semibold" htmlFor="order-valid-until">
              Valid until<span className="text-erp-error"> *</span>
            </label>
            <FormDatePicker
              id="order-valid-until"
              error={Boolean(errors.valid_until)}
              {...register("valid_until")}
            />
          </div>
        </div>

        <Tabs
          items={detailTabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          aria-label="Sale details"
        />

        {activeTab === "lines" ? (
          <div>
            <LineItemsTable<OrderLineFormValue>
              tableId="sales-order-create-lines"
              columns={lineColumns}
              rows={lines}
              onRowsChange={setLines}
              createEmptyRow={() => createEmptyOrderLine(defaultTax?.uuid ?? null)}
              getSpecialRow={getOrderSpecialRow}
              secondaryFooterActions={[
                {
                  key: "section",
                  label: "Add a section",
                  onClick: () => setLines((prev) => [...prev, createOrderSectionLine()]),
                },
                {
                  key: "note",
                  label: "Add a note",
                  onClick: () => setLines((prev) => [...prev, createOrderNoteLine()]),
                },
                {
                  key: "product",
                  label: "New product",
                  onClick: () => {
                    const target =
                      lines.find((line) => line.kind === "product" && !line.description)
                        ?.id ?? null;
                    productLineTarget.current = target;
                    setProductModalName("");
                    setProductModalOpen(true);
                  },
                },
              ]}
              aria-label="Sale lines"
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
                htmlFor="order-customer-reference"
                span={6}
              >
                <FormInput
                  id="order-customer-reference"
                  {...register("customer_reference")}
                />
              </FormField>
              <FormField label="Discount type" htmlFor="order-discount-type" span={3}>
                <FormSelect
                  id="order-discount-type"
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
                  error={Boolean(errors.discount_value)}
                  {...register("discount_value")}
                />
              </FormField>
              <FormField label="Terms and conditions" htmlFor="order-terms" span={12}>
                <FormTextarea id="order-terms" {...register("terms")} />
              </FormField>
              <FormField label="Notes" htmlFor="order-notes" span={12}>
                <FormTextarea id="order-notes" {...register("notes")} />
              </FormField>
            </FormGrid>
          </FormSection>
        )}
      </FormShell>

      <Modal
        open={customerModalOpen}
        title="New customer"
        onClose={() => setCustomerModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={createCustomerMutation.isPending}
              onClick={() => {
                void (async () => {
                  const uuid = await ensureCustomer(customerModalName);
                  if (!uuid) return;
                  setValue("customer", uuid, { shouldValidate: true, shouldDirty: true });
                  setCustomerModalOpen(false);
                  setCustomerModalName("");
                })();
              }}
            >
              Create
            </Button>
          </div>
        }
      >
        <p className="m-0 mb-3 text-[12px] text-erp-muted">
          Name only — other fields stay empty.
        </p>
        <FormField label="Name" htmlFor="sale-customer-quick" required>
          <FormInput
            id="sale-customer-quick"
            chrome="underline"
            value={customerModalName}
            autoFocus
            onChange={(event) => setCustomerModalName(event.target.value)}
          />
        </FormField>
      </Modal>

      <Modal
        open={productModalOpen}
        title="New product"
        onClose={() => setProductModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setProductModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={createProductMutation.isPending}
              onClick={() => {
                void (async () => {
                  const name = productModalName.trim();
                  if (!name) {
                    toast({ title: "Product name is required" });
                    return;
                  }
                  const targetId = productLineTarget.current;
                  const apply = (patch: Partial<OrderLineFormValue>) => {
                    if (!targetId) return;
                    setLines((prev) =>
                      prev.map((line) =>
                        line.id === targetId ? { ...line, ...patch } : line
                      )
                    );
                  };
                  if (targetId) {
                    await applyProductToLine(targetId, name, apply);
                  } else {
                    try {
                      await createProductMutation.mutateAsync({ name });
                      toast({ title: "Product created", variant: "success" });
                      await productsQuery.refetch();
                    } catch (err) {
                      toast({
                        title: "Could not create the product",
                        description:
                          err instanceof ApiError ? err.message : "Please try again.",
                        variant: "error",
                      });
                      return;
                    }
                  }
                  setProductModalOpen(false);
                  setProductModalName("");
                  productLineTarget.current = null;
                })();
              }}
            >
              Create
            </Button>
          </div>
        }
      >
        <p className="m-0 mb-3 text-[12px] text-erp-muted">
          Name only — other fields stay empty.
        </p>
        <FormField label="Name" htmlFor="sale-product-quick" required>
          <FormInput
            id="sale-product-quick"
            chrome="underline"
            value={productModalName}
            autoFocus
            onChange={(event) => setProductModalName(event.target.value)}
          />
        </FormField>
      </Modal>
    </AppShell>
  );
}
