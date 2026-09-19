/**
 * Settings → Sales panels.
 *
 * Built from the same pieces as General so the two modules read as one
 * screen rather than two products. Sale Defaults is a bare `FormShell`,
 * the shape the Language tab already has; Taxes and Payment Methods are a
 * `DataTable` under a `ControlPanel`, the shape Manage Roles and Manage
 * Branches already have — same New button, same status badges, same
 * row-action menu, same loading, error and empty states.
 *
 * What that replaced: a bordered card wrapped around a `FormShell` that
 * draws its own card (two nested boxes, one inset by the shell's margin),
 * two hand-written `<table>`s where the design system has a table, and an
 * add form welded under each of them instead of the New button every
 * other list in the app creates a record with.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Button,
  ControlPanel,
  DataTable,
  FormCheckbox,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
  Modal,
  PageActions,
  StatusBadge,
  useToast,
  type DataTableRowAction,
} from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { listTableState } from "@/lib/listTableState";
import { useSession } from "@/app/session";
import { useBranches } from "@/app/settings/branchesApi";
import {
  useCreatePaymentMethodMutation,
  useCreateTaxMutation,
  usePaymentMethodsQuery,
  useSalesSettingsQuery,
  useTaxesQuery,
  useUpdatePaymentMethodMutation,
  useUpdateSalesSettingsMutation,
  useUpdateTaxMutation,
} from "../shared";
import type {
  PaymentMethod,
  PaymentMethodType,
  SalesSettings,
  SalesTax,
} from "../shared";

const METHOD_TYPE_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank transfer" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

function methodTypeLabel(value: string): string {
  return METHOD_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function toastError(
  toast: ReturnType<typeof useToast>["toast"],
  title: string,
  err: unknown
) {
  toast({
    title,
    description: err instanceof ApiError ? err.message : "Please try again in a moment.",
    variant: "error",
  });
}

function useSalesCanEdit() {
  const session = useSession();
  const codes = session?.permissions;
  return codes == null || codes.includes("settings.client.edit");
}

/**
 * A Sales tab is a plain tabpanel.
 *
 * The card belongs to whatever is inside it — `FormShell` draws one,
 * `DataTable` draws its own — so the panel adds nothing of its own, the
 * way General's tabs do. Wrapping a card in a card is what made this
 * screen sit inside a second inset border.
 */
function SalesTabPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="tabpanel" aria-label={label}>
      {children}
    </div>
  );
}

/** A tab that cannot show its form yet, in the shape of the form it replaces. */
function SalesNotice({ label, children }: { label: string; children: ReactNode }) {
  return (
    <SalesTabPanel label={label}>
      <FormShell className="max-w-3xl">
        <p className="m-0 text-sm text-erp-muted">{children}</p>
      </FormShell>
    </SalesTabPanel>
  );
}

/** The link that opens a record, matching Manage Roles and Manage Branches. */
function RecordNameButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
      onClick={onClick}
    >
      {name}
    </button>
  );
}

/** Active / Default / Archived, read the same way branches are read. */
function lookupStatus(record: { is_archived: boolean; is_default: boolean }): string {
  if (record.is_archived) return "Archived";
  return record.is_default ? "Default" : "Active";
}

/** What an empty prefix saves as — the fallback the API would apply anyway. */
const DEFAULT_SALE_PREFIX = "SL";

/**
 * The number `services.next_number` will build from these three controls:
 * prefix, the branch code when it is asked for, the year, then the counter
 * padded to width, joined by `-` with empty segments dropped.
 *
 * It is here because it earns its place twice over. The year is in every
 * sale number and no control on this form mentions it, so an example is
 * the only thing that says so; and three abstract controls — a prefix, a
 * width, a checkbox — are read far faster as the one string they produce.
 * That is what let the three titled sections collapse into one.
 */
function numberPreview({
  prefix,
  padding,
  withBranch,
  branchCode,
}: {
  prefix: string;
  padding: string;
  withBranch: boolean;
  branchCode: string;
}): string {
  const width = Math.min(Math.max(Math.trunc(Number(padding)) || 1, 1), 10);
  return [
    prefix.trim() || DEFAULT_SALE_PREFIX,
    withBranch ? branchCode : "",
    String(new Date().getFullYear()),
    "1".padStart(width, "0"),
  ]
    .filter(Boolean)
    .join("-");
}

function SaleDefaultsForm({
  settings,
  canEdit,
}: {
  settings: SalesSettings;
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const taxesQuery = useTaxesQuery();
  // Read-open to every member (`IsTenantMember`), and already cached by the
  // Users tab. Only the code is wanted, and only to show it in the example.
  const { branches } = useBranches();
  const saveMutation = useUpdateSalesSettingsMutation();
  const [values, setValues] = useState({
    sale_prefix: settings.sale_prefix,
    has_branch_in_number: settings.has_branch_in_number,
    number_padding: String(settings.number_padding),
    default_due_days: String(settings.default_due_days),
    default_sale_valid_days: String(settings.default_sale_valid_days),
    default_tax: settings.default_tax ?? "",
    sale_terms: settings.sale_terms,
    sale_footer: settings.sale_footer,
  });

  useEffect(() => {
    setValues({
      sale_prefix: settings.sale_prefix,
      has_branch_in_number: settings.has_branch_in_number,
      number_padding: String(settings.number_padding),
      default_due_days: String(settings.default_due_days),
      default_sale_valid_days: String(settings.default_sale_valid_days),
      default_tax: settings.default_tax ?? "",
      sale_terms: settings.sale_terms,
      sale_footer: settings.sale_footer,
    });
  }, [settings]);

  const taxOptions = [
    { value: "", label: "No default tax" },
    ...(taxesQuery.data?.data ?? [])
      .filter((tax) => !tax.is_archived)
      .map((tax) => ({
        value: tax.uuid,
        label: `${tax.name} (${tax.rate}%)`,
      })),
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    const padding = Number(values.number_padding);
    const dueDays = Number(values.default_due_days);
    if (!Number.isFinite(padding) || padding < 1 || padding > 10) {
      toast({ title: "Number padding must be between 1 and 10" });
      return;
    }
    if (!Number.isFinite(dueDays) || dueDays < 0) {
      toast({ title: "Default due days must be zero or more" });
      return;
    }
    const validDays = Number(values.default_sale_valid_days);
    if (!Number.isFinite(validDays) || validDays < 0) {
      toast({ title: "Default valid days must be zero or more" });
      return;
    }
    try {
      await saveMutation.mutateAsync({
        sale_prefix: values.sale_prefix.trim() || DEFAULT_SALE_PREFIX,
        has_branch_in_number: values.has_branch_in_number,
        number_padding: padding,
        default_due_days: dueDays,
        default_sale_valid_days: validDays,
        default_tax: values.default_tax || null,
        sale_terms: values.sale_terms,
        sale_footer: values.sale_footer,
      });
      toast({ title: "Sales settings saved", variant: "success" });
    } catch (err) {
      toastError(toast, "Could not save sales settings", err);
    }
  }

  const preview = numberPreview({
    prefix: values.sale_prefix,
    padding: values.number_padding,
    withBranch: values.has_branch_in_number,
    branchCode: branches.find((branch) => branch.is_default)?.code ?? "",
  });

  return (
    <FormShell onSubmit={handleSubmit} className="max-w-3xl mt-4">
      <FormSection title="Sale defaults">
        <FormGrid>
          <FormField label="Prefix" htmlFor="sales-sale-prefix" span={3}>
            <FormInput
              id="sales-sale-prefix"
              value={values.sale_prefix}
              onChange={(event) =>
                setValues((current) => ({ ...current, sale_prefix: event.target.value }))
              }
              maxLength={10}
            />
          </FormField>
          <FormField label="Padding" htmlFor="sales-number-padding" span={3}>
            <FormInput
              id="sales-number-padding"
              type="number"
              min={1}
              max={10}
              value={values.number_padding}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  number_padding: event.target.value,
                }))
              }
            />
          </FormField>
          <FormField span={6}>
            <FormCheckbox
              id="sales-branch-in-number"
              label="Include the branch code"
              checked={values.has_branch_in_number}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  has_branch_in_number: event.target.checked,
                }))
              }
            />
          </FormField>

          <p className="col-span-12 m-0 text-[10.5px] text-erp-subtle">
            A sent sale is numbered{" "}
            <span className="font-mono text-erp-text">{preview}</span> — a draft has no
            number at all.
          </p>

          <FormField label="Due days" htmlFor="sales-default-due-days" span={3}>
            <FormInput
              id="sales-default-due-days"
              type="number"
              min={0}
              value={values.default_due_days}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  default_due_days: event.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Valid days" htmlFor="sales-default-valid-days" span={3}>
            <FormInput
              id="sales-default-valid-days"
              type="number"
              min={0}
              value={values.default_sale_valid_days}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  default_sale_valid_days: event.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Tax" htmlFor="sales-default-tax" span={6}>
            <FormSelect
              id="sales-default-tax"
              options={taxOptions}
              value={values.default_tax}
              onChange={(event) =>
                setValues((current) => ({ ...current, default_tax: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Terms" htmlFor="sales-sale-terms" span={12}>
            <FormTextarea
              id="sales-sale-terms"
              rows={2}
              value={values.sale_terms}
              onChange={(event) =>
                setValues((current) => ({ ...current, sale_terms: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Footer" htmlFor="sales-sale-footer" span={12}>
            <FormTextarea
              id="sales-sale-footer"
              rows={2}
              value={values.sale_footer}
              onChange={(event) =>
                setValues((current) => ({ ...current, sale_footer: event.target.value }))
              }
            />
          </FormField>
        </FormGrid>
      </FormSection>

      {canEdit ? (
        <div className="flex justify-end border-t border-erp-border px-[13px] py-3">
          <Button type="submit" variant="primary" loading={saveMutation.isPending}>
            Save
          </Button>
        </div>
      ) : null}
    </FormShell>
  );
}

interface TaxDraft {
  /** null while creating. */
  uuid: string | null;
  name: string;
  rate: string;
  isDefault: boolean;
}

function TaxesTable({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const taxesQuery = useTaxesQuery();
  const table = listTableState(taxesQuery);
  const createMutation = useCreateTaxMutation();
  const updateMutation = useUpdateTaxMutation();
  const [draft, setDraft] = useState<TaxDraft | null>(null);

  const columns = useMemo<ColumnDef<SalesTax>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tax",
        meta: { fill: true },
        size: 220,
        cell: ({ row }) => {
          const tax = row.original;
          return canEdit ? (
            <RecordNameButton
              name={tax.name}
              onClick={() =>
                setDraft({
                  uuid: tax.uuid,
                  name: tax.name,
                  rate: tax.rate,
                  isDefault: tax.is_default,
                })
              }
            />
          ) : (
            <span>{tax.name}</span>
          );
        },
      },
      {
        accessorKey: "rate",
        header: "Rate",
        size: 110,
        cell: ({ getValue }) => `${String(getValue())}%`,
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        size: 120,
        cell: ({ row }) => <StatusBadge status={lookupStatus(row.original)} />,
      },
    ],
    [canEdit]
  );

  /** Only the actions this viewer may actually perform are offered. */
  function rowActions(tax: SalesTax): DataTableRowAction[] {
    if (!canEdit) return [];
    const actions: DataTableRowAction[] = [
      {
        key: "edit",
        label: "Edit",
        onClick: () =>
          setDraft({
            uuid: tax.uuid,
            name: tax.name,
            rate: tax.rate,
            isDefault: tax.is_default,
          }),
      },
    ];
    // An archived rate cannot become the one new sales reach for, and the
    // default cannot be demoted on its own — promoting another moves it.
    if (!tax.is_default && !tax.is_archived) {
      actions.push({
        key: "default",
        label: "Make default",
        onClick: () => void setDefault(tax),
      });
    }
    actions.push({
      key: "archive",
      label: tax.is_archived ? "Restore" : "Archive",
      onClick: () => void setArchived(tax, !tax.is_archived),
    });
    return actions;
  }

  async function setDefault(tax: SalesTax) {
    try {
      await updateMutation.mutateAsync({ uuid: tax.uuid, input: { is_default: true } });
      toast({
        title: "Default tax changed",
        description: `New sales start at ${tax.name}.`,
        variant: "success",
      });
    } catch (err) {
      toastError(toast, "Could not change the default tax", err);
    }
  }

  async function setArchived(tax: SalesTax, isArchived: boolean) {
    try {
      await updateMutation.mutateAsync({
        uuid: tax.uuid,
        input: { is_archived: isArchived },
      });
      toast({
        title: isArchived ? "Tax archived" : "Tax restored",
        variant: "success",
      });
    } catch (err) {
      toastError(toast, "Could not update the tax", err);
    }
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const name = draft.name.trim();
    const rate = Number(draft.rate);
    if (!name) {
      toast({ title: "Tax name is required" });
      return;
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast({ title: "Rate must be between 0 and 100" });
      return;
    }
    // `is_default` goes only when it is being turned ON: the workspace
    // always has exactly one default, so unticking the box here would ask
    // for none at all rather than for a different one.
    const input = {
      name,
      rate: rate.toFixed(2),
      ...(draft.isDefault ? { is_default: true } : {}),
    };
    try {
      if (draft.uuid) {
        await updateMutation.mutateAsync({ uuid: draft.uuid, input });
        toast({ title: "Tax saved", variant: "success" });
      } else {
        await createMutation.mutateAsync(input);
        toast({ title: "Tax added", variant: "success" });
      }
      setDraft(null);
    } catch (err) {
      toastError(
        toast,
        draft.uuid ? "Could not save the tax" : "Could not add the tax",
        err
      );
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <DataTable
        tableId="settings-sales-taxes"
        renderToolbar={({ searchFilter }) => (
          <ControlPanel
            pageActions={
              canEdit ? (
                <PageActions
                  buttons={[
                    {
                      key: "new",
                      children: "New",
                      variant: "primary",
                      size: "sm",
                      onClick: () =>
                        setDraft({ uuid: null, name: "", rate: "", isDefault: false }),
                    },
                  ]}
                />
              ) : undefined
            }
          >
            {searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        data={table.rows}
        searchable
        searchPlaceholder="Search taxes…"
        loading={table.loading}
        fetching={table.fetching}
        error={table.error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={false}
        emptyMessage="No taxes yet."
      />

      <Modal
        open={draft !== null}
        title={draft?.uuid ? "Edit tax" : "New tax"}
        onClose={() => setDraft(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDraft(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="sales-tax-form"
              variant="primary"
              size="sm"
              loading={saving}
            >
              {draft?.uuid ? "Save" : "Create"}
            </Button>
          </div>
        }
      >
        <form id="sales-tax-form" onSubmit={(event) => void saveDraft(event)} noValidate>
          <FormGrid>
            <FormField label="Name" htmlFor="sales-tax-name" required span={12}>
              <FormInput
                id="sales-tax-name"
                chrome="underline"
                autoFocus
                value={draft?.name ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, name: event.target.value } : current
                  )
                }
              />
            </FormField>
            <FormField label="Rate %" htmlFor="sales-tax-rate" required span={12}>
              <FormInput
                id="sales-tax-rate"
                chrome="underline"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={draft?.rate ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, rate: event.target.value } : current
                  )
                }
              />
            </FormField>
            <FormField span={12}>
              <FormCheckbox
                id="sales-tax-default"
                label="New sales start at this rate"
                checked={draft?.isDefault ?? false}
                disabled={draft?.isDefault === true && draft.uuid !== null}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, isDefault: event.target.checked } : current
                  )
                }
              />
            </FormField>
          </FormGrid>
        </form>
      </Modal>
    </>
  );
}

interface MethodDraft {
  /** null while creating. */
  uuid: string | null;
  name: string;
  methodType: PaymentMethodType;
  isDefault: boolean;
}

function PaymentMethodsTable({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const methodsQuery = usePaymentMethodsQuery();
  const table = listTableState(methodsQuery);
  const createMutation = useCreatePaymentMethodMutation();
  const updateMutation = useUpdatePaymentMethodMutation();
  const [draft, setDraft] = useState<MethodDraft | null>(null);

  function draftOf(method: PaymentMethod): MethodDraft {
    return {
      uuid: method.uuid,
      name: method.name,
      methodType: method.method_type as PaymentMethodType,
      isDefault: method.is_default,
    };
  }

  const columns = useMemo<ColumnDef<PaymentMethod>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Method",
        meta: { fill: true },
        size: 220,
        cell: ({ row }) => {
          const method = row.original;
          return canEdit ? (
            <RecordNameButton
              name={method.name}
              onClick={() => setDraft(draftOf(method))}
            />
          ) : (
            <span>{method.name}</span>
          );
        },
      },
      {
        accessorKey: "method_type",
        header: "Type",
        size: 150,
        cell: ({ getValue }) => methodTypeLabel(String(getValue())),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        size: 120,
        cell: ({ row }) => <StatusBadge status={lookupStatus(row.original)} />,
      },
    ],
    [canEdit]
  );

  /** Only the actions this viewer may actually perform are offered. */
  function rowActions(method: PaymentMethod): DataTableRowAction[] {
    if (!canEdit) return [];
    const actions: DataTableRowAction[] = [
      { key: "edit", label: "Edit", onClick: () => setDraft(draftOf(method)) },
    ];
    if (!method.is_default && !method.is_archived) {
      actions.push({
        key: "default",
        label: "Make default",
        onClick: () => void setDefault(method),
      });
    }
    actions.push({
      key: "archive",
      label: method.is_archived ? "Restore" : "Archive",
      onClick: () => void setArchived(method, !method.is_archived),
    });
    return actions;
  }

  async function setDefault(method: PaymentMethod) {
    try {
      await updateMutation.mutateAsync({
        uuid: method.uuid,
        input: { is_default: true },
      });
      toast({
        title: "Default payment method changed",
        description: `Payments are taken as ${method.name} unless changed.`,
        variant: "success",
      });
    } catch (err) {
      toastError(toast, "Could not change the default payment method", err);
    }
  }

  async function setArchived(method: PaymentMethod, isArchived: boolean) {
    try {
      await updateMutation.mutateAsync({
        uuid: method.uuid,
        input: { is_archived: isArchived },
      });
      toast({
        title: isArchived ? "Payment method archived" : "Payment method restored",
        variant: "success",
      });
    } catch (err) {
      toastError(toast, "Could not update the payment method", err);
    }
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      toast({ title: "Payment method name is required" });
      return;
    }
    // See TaxesTable.saveDraft: the flag only ever travels turned ON.
    const input = {
      name,
      method_type: draft.methodType,
      ...(draft.isDefault ? { is_default: true } : {}),
    };
    try {
      if (draft.uuid) {
        await updateMutation.mutateAsync({ uuid: draft.uuid, input });
        toast({ title: "Payment method saved", variant: "success" });
      } else {
        await createMutation.mutateAsync(input);
        toast({ title: "Payment method added", variant: "success" });
      }
      setDraft(null);
    } catch (err) {
      toastError(
        toast,
        draft.uuid
          ? "Could not save the payment method"
          : "Could not add the payment method",
        err
      );
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <DataTable
        tableId="settings-sales-payment-methods"
        renderToolbar={({ searchFilter }) => (
          <ControlPanel
            pageActions={
              canEdit ? (
                <PageActions
                  buttons={[
                    {
                      key: "new",
                      children: "New",
                      variant: "primary",
                      size: "sm",
                      onClick: () =>
                        setDraft({
                          uuid: null,
                          name: "",
                          methodType: "cash",
                          isDefault: false,
                        }),
                    },
                  ]}
                />
              ) : undefined
            }
          >
            {searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        data={table.rows}
        searchable
        searchPlaceholder="Search payment methods…"
        loading={table.loading}
        fetching={table.fetching}
        error={table.error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={false}
        emptyMessage="No payment methods yet."
      />

      <Modal
        open={draft !== null}
        title={draft?.uuid ? "Edit payment method" : "New payment method"}
        onClose={() => setDraft(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDraft(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="sales-method-form"
              variant="primary"
              size="sm"
              loading={saving}
            >
              {draft?.uuid ? "Save" : "Create"}
            </Button>
          </div>
        }
      >
        <form
          id="sales-method-form"
          onSubmit={(event) => void saveDraft(event)}
          noValidate
        >
          <FormGrid>
            <FormField label="Name" htmlFor="sales-method-name" required span={12}>
              <FormInput
                id="sales-method-name"
                chrome="underline"
                autoFocus
                value={draft?.name ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, name: event.target.value } : current
                  )
                }
              />
            </FormField>
            <FormField label="Type" htmlFor="sales-method-type" span={12}>
              <FormSelect
                id="sales-method-type"
                options={METHOD_TYPE_OPTIONS}
                value={draft?.methodType ?? "cash"}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          methodType: event.target.value as PaymentMethodType,
                        }
                      : current
                  )
                }
              />
            </FormField>
            <FormField span={12}>
              <FormCheckbox
                id="sales-method-default"
                label="Offer this method first"
                checked={draft?.isDefault ?? false}
                disabled={draft?.isDefault === true && draft.uuid !== null}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, isDefault: event.target.checked } : current
                  )
                }
              />
            </FormField>
          </FormGrid>
        </form>
      </Modal>
    </>
  );
}

/** Settings → Sales → Sale Defaults. */
export function SalesDefaultsPanel() {
  const canEdit = useSalesCanEdit();
  const settingsQuery = useSalesSettingsQuery();

  if (settingsQuery.isLoading) {
    return <SalesNotice label="Sale Defaults">Loading sale defaults…</SalesNotice>;
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <SalesNotice label="Sale Defaults">
        Could not load sale defaults. Enable the Sales module and try again.
      </SalesNotice>
    );
  }

  return (
    <SalesTabPanel label="Sale Defaults">
      <SaleDefaultsForm settings={settingsQuery.data} canEdit={canEdit} />
    </SalesTabPanel>
  );
}

/** Settings → Sales → Taxes. */
export function SalesTaxesPanel() {
  const canEdit = useSalesCanEdit();
  return (
    <SalesTabPanel label="Taxes">
      <TaxesTable canEdit={canEdit} />
    </SalesTabPanel>
  );
}

/** Settings → Sales → Payment Methods. */
export function SalesPaymentMethodsPanel() {
  const canEdit = useSalesCanEdit();
  return (
    <SalesTabPanel label="Payment Methods">
      <PaymentMethodsTable canEdit={canEdit} />
    </SalesTabPanel>
  );
}
