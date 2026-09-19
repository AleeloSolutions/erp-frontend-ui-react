/**
 * New sale, against `/api/v1/sales/`.
 *
 * A new sale is always a draft: `POST` stores it, and only sending it
 * later allocates a number. Nothing here computes what will be charged —
 * the amounts beside the lines are the editor's own estimate, shown so the
 * page is not blank while the draft is typed, and they are replaced by the
 * server's figures the moment it is saved.
 *
 * Customers and products are chosen with `RecordPicker`, which searches the
 * server on every keystroke. Neither name is unique any more, so typed text
 * is never resolved to an existing record by matching it: the only ways to
 * get a record are picking a row or explicitly creating one.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import {
  ControlPanel,
  Dropdown,
  FormDatePicker,
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
  RecordFormFields,
  RecordFormModal,
  RecordPicker,
  Tabs,
  Textarea,
  useToast,
  type DropdownItem,
  type FieldOption,
  type LineItemsColumn,
  type LineItemsRowHelpers,
  type LineItemsSpecialRow,
  type PickerItem,
  type RecordSearchColumn,
  type StatusStep,
} from "@erp/ui";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { useCreateCustomerMutation } from "@/modules/sales/customers";
import { listCustomers, type Customer } from "@/modules/sales/customers/api";
import { customerFields } from "@/modules/sales/customers/fields";
import {
  EMPTY_CUSTOMER,
  customerFormSchema,
  type CustomerFormValues,
} from "@/modules/sales/customers/schema";
import { useCreateProductMutation } from "@/modules/sales/products";
import { listProducts, type Product } from "@/modules/sales/products/api";
import { productFields } from "@/modules/sales/products/fields";
import {
  EMPTY_PRODUCT,
  productFormSchema,
  toProductInput,
  type ProductFormValues,
} from "@/modules/sales/products/schema";
import { useCreateSaleMutation } from "../queries";
import { can, useSalesSettingsQuery, useTaxesQuery } from "@/modules/sales/shared";
import {
  createEmptySaleLine,
  createSaleNoteLine,
  createSaleSectionLine,
  emptySaleForm,
  estimateLineAmount,
  estimateUntaxedTotal,
  formatMoney,
  hasChargeableLine,
  saleFormSchema,
  toLineInputs,
  validUntilFrom,
  type SaleFormValues,
  type SaleLineFormValue,
} from "@/modules/sales/sale/schema";
import { ApiError } from "@/lib/api-client";
import { rhfAdapter } from "@/lib/form-adapter";

/** Read-only until it is saved and sent — sending is its own action. */
const statusSteps: StatusStep[] = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Pending" },
];

const detailTabs = [
  { key: "lines", label: "Sale Lines" },
  { key: "other", label: "Other Info" },
];

/** Rows shown inline before "Search more…" — and so the page size we ask for. */
const PICKER_LIMIT = 5;

/** The record behind a picker row, put there when the row was mapped. */
function metaOf<T>(item: PickerItem | null | undefined): T | undefined {
  return item?.meta as T | undefined;
}

/**
 * Two customers may legitimately share a name, so the row has to carry
 * something that tells them apart — that is what `secondary` is for.
 */
function toCustomerItem(customer: Customer): PickerItem {
  const secondary = [customer.email, customer.phone || customer.mobile]
    .filter(Boolean)
    .join(" · ");
  return {
    key: customer.uuid,
    label: customer.name,
    secondary: secondary || undefined,
    meta: customer,
  };
}

/** Same problem, same answer: the code and the price identify the product. */
function toProductItem(product: Product): PickerItem {
  const secondary = [product.code, product.unit_price].filter(Boolean).join(" · ");
  return {
    key: product.uuid,
    label: product.name,
    secondary: secondary || undefined,
    meta: product,
  };
}

const customerSearchColumns: RecordSearchColumn<PickerItem>[] = [
  { header: "Name", cell: (item) => item.label },
  {
    header: "Email",
    cell: (item) => metaOf<Customer>(item)?.email || "—",
    width: "220px",
  },
  {
    header: "Phone",
    cell: (item) => {
      const customer = metaOf<Customer>(item);
      return customer?.phone || customer?.mobile || "—";
    },
    width: "160px",
  },
];

const productSearchColumns: RecordSearchColumn<PickerItem>[] = [
  { header: "Name", cell: (item) => item.label },
  {
    header: "Code",
    cell: (item) => metaOf<Product>(item)?.code || "—",
    width: "160px",
  },
  {
    header: "Unit price",
    cell: (item) => metaOf<Product>(item)?.unit_price ?? "—",
    width: "120px",
  },
];

/** Odoo behaviour: a section subtotals every product row below it, down to the next section. */
function sectionEstimate(sectionLine: SaleLineFormValue, allLines: SaleLineFormValue[]) {
  const startIndex = allLines.findIndex((line) => line.id === sectionLine.id);
  let sum = 0;
  for (let i = startIndex + 1; i < allLines.length; i++) {
    const line = allLines[i];
    if (line.kind === "section") break;
    sum += estimateLineAmount(line);
  }
  return sum;
}

export default function SaleCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useSalesNavbar("sales");
  const createMutation = useCreateSaleMutation();
  const canCreate = can(session?.permissions, "sales.sale", "create");

  useEffect(() => {
    if (session && !canCreate) {
      navigate("/sales", { replace: true });
    }
  }, [session, canCreate, navigate]);

  const [activeTab, setActiveTab] = useState("lines");
  const [lines, setLines] = useState<SaleLineFormValue[]>([createEmptySaleLine()]);
  const [linesError, setLinesError] = useState<string | null>(null);

  const createCustomerMutation = useCreateCustomerMutation();
  const createProductMutation = useCreateProductMutation();
  const taxesQuery = useTaxesQuery();
  const settingsQuery = useSalesSettingsQuery();
  const settings = settingsQuery.data;

  const taxes = useMemo(
    () => (taxesQuery.data?.data ?? []).filter((tax) => !tax.is_archived),
    [taxesQuery.data]
  );
  const defaultTax = taxes.find((tax) => tax.is_default) ?? null;
  const defaultValidDays = settings?.default_sale_valid_days ?? 30;

  const taxItems = useMemo<DropdownItem[]>(
    () => taxes.map((tax) => ({ key: tax.uuid, label: `${tax.name} (${tax.rate}%)` })),
    [taxes]
  );
  // `productFields` reads its `default_tax` choices through `optionsKey: "taxes"`.
  // The empty option leads because a `<select>` has no null.
  const taxOptions = useMemo<FieldOption[]>(
    () => [
      { value: "", label: "No tax" },
      ...taxes.map((tax) => ({ value: tax.uuid, label: `${tax.name} (${tax.rate}%)` })),
    ],
    [taxes]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: emptySaleForm(),
  });

  // The form stores the customer's uuid; the picker also needs a label to
  // show, and the header needs the currency, so both are kept beside it.
  const [customerLabel, setCustomerLabel] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState("");
  // `createCustomer` answers with the whole record but the picker hands back
  // only a key, so the rest waits here for the `onChange` that follows.
  const justCreatedCustomer = useRef<Customer | null>(null);

  const customerUuid = watch("customer");

  function selectCustomer(uuid: string, name: string, customerCurrency: string) {
    setValue("customer", uuid, { shouldValidate: true, shouldDirty: true });
    setCustomerLabel(name);
    setCurrency(customerCurrency);
    setValue("valid_until", validUntilFrom(watch("issue_date"), defaultValidDays), {
      shouldDirty: true,
    });
  }

  function clearCustomer() {
    setValue("customer", "", { shouldValidate: true, shouldDirty: true });
    setCustomerLabel(undefined);
    setCurrency("");
  }

  // Which product each line points at. The line itself only stores the
  // description the API stores, and names are no longer unique, so the uuid
  // the picker selected is remembered here, keyed by the row's id.
  const [lineProducts, setLineProducts] = useState<Record<string, string>>({});

  function selectLineProduct(lineId: string, product: Product) {
    setLineProducts((previous) => ({ ...previous, [lineId]: product.uuid }));
    setLines((previous) =>
      previous.map((line) =>
        line.id === lineId
          ? {
              ...line,
              description: product.name,
              unit_price: product.unit_price || "0.00",
              tax: product.default_tax ?? defaultTax?.uuid ?? null,
            }
          : line
      )
    );
  }

  /** The row is gone; drop what was remembered about it. */
  function forgetLineProduct(lineId: string) {
    setLineProducts((previous) => {
      if (!(lineId in previous)) return previous;
      const next = { ...previous };
      delete next[lineId];
      return next;
    });
  }

  function clearLineProduct(lineId: string) {
    forgetLineProduct(lineId);
    setLines((previous) =>
      previous.map((line) => (line.id === lineId ? { ...line, description: "" } : line))
    );
  }

  // Tenant defaults arrive after the first render; seed valid-until and terms
  // into the untouched form rather than making them a manual step.
  const settingsSeeded = useRef(false);
  useEffect(() => {
    if (!settings || settingsSeeded.current) return;
    settingsSeeded.current = true;
    setValue(
      "valid_until",
      validUntilFrom(watch("issue_date"), settings.default_sale_valid_days ?? 30)
    );
    if (settings.sale_terms) {
      setValue("terms", settings.sale_terms);
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

  /* ---- Quick-create forms behind the pickers' "Create and edit…" rows ---- */

  const [customerDraftOpen, setCustomerDraftOpen] = useState(false);
  const [customerDraftError, setCustomerDraftError] = useState<string | null>(null);
  const customerDraftForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: EMPTY_CUSTOMER,
  });

  /** `lineId` is the row the new product lands on, or null for catalogue-only. */
  const [productDraft, setProductDraft] = useState<{ lineId: string | null } | null>(
    null
  );
  const [productDraftError, setProductDraftError] = useState<string | null>(null);
  const productDraftForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: EMPTY_PRODUCT,
  });

  function openCustomerDraft(text: string) {
    setCustomerDraftError(null);
    customerDraftForm.reset({ ...EMPTY_CUSTOMER, name: text });
    setCustomerDraftOpen(true);
  }

  function openProductDraft(lineId: string | null, text: string) {
    setProductDraftError(null);
    productDraftForm.reset({
      ...EMPTY_PRODUCT,
      name: text,
      default_tax: defaultTax?.uuid ?? "",
    });
    setProductDraft({ lineId });
  }

  async function saveCustomerDraft(values: CustomerFormValues) {
    setCustomerDraftError(null);
    try {
      const created = await createCustomerMutation.mutateAsync({
        ...values,
        currency: values.currency.toUpperCase(),
        country: values.country.toUpperCase(),
      });
      selectCustomer(created.uuid, created.name, created.currency);
      setCustomerDraftOpen(false);
      toast({ title: "Customer created", variant: "success" });
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field in customerFormSchema.shape) {
            customerDraftForm.setError(field as keyof CustomerFormValues, {
              message: messages[0],
            });
          }
        }
      }
      setCustomerDraftError(
        error instanceof ApiError ? error.message : "Please try again."
      );
    }
  }

  async function saveProductDraft(values: ProductFormValues) {
    setProductDraftError(null);
    const lineId = productDraft?.lineId ?? null;
    try {
      const created = await createProductMutation.mutateAsync(toProductInput(values));
      if (lineId) selectLineProduct(lineId, created);
      setProductDraft(null);
      toast({ title: "Product created", variant: "success" });
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field in productFormSchema.shape) {
            productDraftForm.setError(field as keyof ProductFormValues, {
              message: messages[0],
            });
          }
        }
      }
      setProductDraftError(
        error instanceof ApiError ? error.message : "Please try again."
      );
    }
  }

  const untaxedEstimate = estimateUntaxedTotal(lines);

  const lineColumns: LineItemsColumn<SaleLineFormValue>[] = [
    {
      key: "description",
      label: "Product",
      size: 340,
      minSize: 200,
      maxSize: 560,
      renderCell: (row, { onChange, onCommit }) =>
        row.kind === "product" ? (
          <RecordPicker
            id={`line-product-${row.id}`}
            placeholder="Search a product…"
            limit={PICKER_LIMIT}
            value={lineProducts[row.id] ?? null}
            valueLabel={row.description || undefined}
            searchMoreColumns={productSearchColumns}
            searchMoreTitle="Search: Products"
            onSearch={async (query, options) => {
              const page = await listProducts(
                {
                  search: query,
                  ordering: "name",
                  page: options.page,
                  pageSize: options.pageSize ?? PICKER_LIMIT,
                  filters: { is_archived: "false" },
                },
                { signal: options.signal }
              );
              return { items: page.data.map(toProductItem), total: page.meta.total };
            }}
            onCreate={async (text) => {
              try {
                const created = await createProductMutation.mutateAsync({ name: text });
                // The picker only hands a key back to `onChange`, so the row is
                // filled in here, where the whole record is still in hand.
                selectLineProduct(row.id, created);
                toast({ title: "Product created", variant: "success" });
                return created.uuid;
              } catch (error) {
                toast({
                  title: "Could not create the product",
                  description:
                    error instanceof ApiError ? error.message : "Please try again.",
                  variant: "error",
                });
                throw error;
              }
            }}
            onCreateAndEdit={(text) => openProductDraft(row.id, text)}
            onChange={(_key, item) => {
              const product = metaOf<Product>(item);
              if (product) {
                selectLineProduct(row.id, product);
                return;
              }
              // No record on the row means the clear button, or the quick
              // create that already wrote this line when it resolved.
              if (!item) clearLineProduct(row.id);
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

  function getSaleSpecialRow(
    row: SaleLineFormValue,
    { onChange, onCommit }: LineItemsRowHelpers<SaleLineFormValue>
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

  async function onSubmit(values: SaleFormValues) {
    if (!hasChargeableLine(lines)) {
      setLinesError("Add at least one line with a description.");
      setActiveTab("lines");
      return;
    }
    setLinesError(null);

    try {
      const sale = await createMutation.mutateAsync({
        ...values,
        lines: toLineInputs(lines),
      });
      toast({
        title: "Draft sale created",
        description: "It gets its number when you send it.",
        variant: "success",
      });
      // Straight to the record: sending, and the server's real totals, live there.
      navigate(`/sales/${sale.uuid}/edit`);
    } catch (error) {
      // The API owns the rules the form cannot know — a customer over their
      // credit limit, a tax that no longer applies.
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field in saleFormSchema.shape) {
            setError(field as keyof SaleFormValues, { message: messages[0] });
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
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
              <label className="text-base font-[500]" htmlFor="sale-customer">
                Customer<span className="text-erp-error"> *</span>
              </label>
              <div className="max-w-sm">
                <RecordPicker
                  id="sale-customer"
                  placeholder="Search a customer…"
                  limit={PICKER_LIMIT}
                  error={Boolean(errors.customer)}
                  value={customerUuid || null}
                  valueLabel={customerLabel}
                  searchMoreColumns={customerSearchColumns}
                  searchMoreTitle="Search: Customers"
                  onSearch={async (query, options) => {
                    const page = await listCustomers(
                      {
                        search: query,
                        ordering: "name",
                        page: options.page,
                        pageSize: options.pageSize ?? PICKER_LIMIT,
                        filters: { is_archived: "false" },
                      },
                      { signal: options.signal }
                    );
                    return {
                      items: page.data.map(toCustomerItem),
                      total: page.meta.total,
                    };
                  }}
                  onCreate={async (text) => {
                    try {
                      const created = await createCustomerMutation.mutateAsync({
                        name: text,
                      });
                      justCreatedCustomer.current = created;
                      toast({ title: "Customer created", variant: "success" });
                      return created.uuid;
                    } catch (error) {
                      toast({
                        title: "Could not create the customer",
                        description:
                          error instanceof ApiError ? error.message : "Please try again.",
                        variant: "error",
                      });
                      throw error;
                    }
                  }}
                  onCreateAndEdit={openCustomerDraft}
                  onChange={(key, item) => {
                    if (!key) {
                      clearCustomer();
                      return;
                    }
                    const created = justCreatedCustomer.current;
                    const customer =
                      metaOf<Customer>(item) ??
                      (created?.uuid === key ? created : undefined);
                    selectCustomer(
                      key,
                      customer?.name ?? item?.label ?? "",
                      customer?.currency ?? ""
                    );
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
            <label className="font-semibold" htmlFor="sale-date">
              Sale date<span className="text-erp-error"> *</span>
            </label>
            <FormDatePicker
              id="sale-date"
              error={Boolean(errors.issue_date)}
              {...register("issue_date")}
            />
            <label className="font-[500] font-semibold" htmlFor="sale-valid-until">
              Valid until<span className="text-erp-error"> *</span>
            </label>
            <FormDatePicker
              id="sale-valid-until"
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
            <LineItemsTable<SaleLineFormValue>
              tableId="sales-sale-create-lines"
              columns={lineColumns}
              rows={lines}
              onRowsChange={setLines}
              onRemoveRow={forgetLineProduct}
              createEmptyRow={() => createEmptySaleLine(defaultTax?.uuid ?? null)}
              getSpecialRow={getSaleSpecialRow}
              secondaryFooterActions={[
                {
                  key: "section",
                  label: "Add a section",
                  onClick: () => setLines((prev) => [...prev, createSaleSectionLine()]),
                },
                {
                  key: "note",
                  label: "Add a note",
                  onClick: () => setLines((prev) => [...prev, createSaleNoteLine()]),
                },
                {
                  key: "product",
                  label: "New product",
                  onClick: () => {
                    const target =
                      lines.find((line) => line.kind === "product" && !line.description)
                        ?.id ?? null;
                    openProductDraft(target, "");
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
                htmlFor="sale-customer-reference"
                span={6}
              >
                <FormInput
                  id="sale-customer-reference"
                  {...register("customer_reference")}
                />
              </FormField>
              <FormField label="Discount type" htmlFor="sale-discount-type" span={3}>
                <FormSelect
                  id="sale-discount-type"
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
                  error={Boolean(errors.discount_value)}
                  {...register("discount_value")}
                />
              </FormField>
              <FormField label="Terms and conditions" htmlFor="sale-terms" span={12}>
                <FormTextarea id="sale-terms" {...register("terms")} />
              </FormField>
              <FormField label="Notes" htmlFor="sale-notes" span={12}>
                <FormTextarea id="sale-notes" {...register("notes")} />
              </FormField>
            </FormGrid>
          </FormSection>
        )}
      </FormShell>

      {/* The same schema the customer pages render, so a customer added from
          here cannot drift from one added from its own form. */}
      <RecordFormModal
        open={customerDraftOpen}
        title="New customer"
        saving={createCustomerMutation.isPending}
        error={customerDraftError}
        onClose={() => setCustomerDraftOpen(false)}
        onSave={customerDraftForm.handleSubmit(saveCustomerDraft)}
      >
        <RecordFormFields
          fields={customerFields}
          adapter={rhfAdapter(
            customerDraftForm.register,
            customerDraftForm.formState.errors
          )}
        />
      </RecordFormModal>

      <RecordFormModal
        open={productDraft !== null}
        title="New product"
        saving={createProductMutation.isPending}
        error={productDraftError}
        onClose={() => setProductDraft(null)}
        onSave={productDraftForm.handleSubmit(saveProductDraft)}
      >
        <RecordFormFields
          fields={productFields}
          adapter={rhfAdapter(
            productDraftForm.register,
            productDraftForm.formState.errors
          )}
          options={{ taxes: taxOptions }}
        />
      </RecordFormModal>
    </AppShell>
  );
}
