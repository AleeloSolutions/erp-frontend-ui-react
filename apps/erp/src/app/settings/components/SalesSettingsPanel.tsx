import { useEffect, useState } from "react";
import {
  Button,
  FormCheckbox,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
  useToast,
} from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { useSession } from "@/app/session";
import {
  useCreatePaymentMethodMutation,
  useCreateTaxMutation,
  usePaymentMethodsQuery,
  useSalesSettingsQuery,
  useTaxesQuery,
  useUpdatePaymentMethodMutation,
  useUpdateSalesSettingsMutation,
  useUpdateTaxMutation,
} from "@/modules/sales/shared";
import type { PaymentMethodType, SalesSettings } from "@/modules/sales/shared";

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
  });
}

function InvoiceDefaultsForm({
  settings,
  canEdit,
}: {
  settings: SalesSettings;
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const taxesQuery = useTaxesQuery();
  const saveMutation = useUpdateSalesSettingsMutation();
  const [values, setValues] = useState({
    invoice_prefix: settings.invoice_prefix,
    quotation_prefix: settings.quotation_prefix,
    has_branch_in_number: settings.has_branch_in_number,
    number_padding: String(settings.number_padding),
    default_due_days: String(settings.default_due_days),
    default_valid_days: String(settings.default_valid_days),
    default_tax: settings.default_tax ?? "",
    invoice_terms: settings.invoice_terms,
    invoice_footer: settings.invoice_footer,
    quotation_terms: settings.quotation_terms,
  });

  useEffect(() => {
    setValues({
      invoice_prefix: settings.invoice_prefix,
      quotation_prefix: settings.quotation_prefix,
      has_branch_in_number: settings.has_branch_in_number,
      number_padding: String(settings.number_padding),
      default_due_days: String(settings.default_due_days),
      default_valid_days: String(settings.default_valid_days),
      default_tax: settings.default_tax ?? "",
      invoice_terms: settings.invoice_terms,
      invoice_footer: settings.invoice_footer,
      quotation_terms: settings.quotation_terms,
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
    const validDays = Number(values.default_valid_days);
    if (!Number.isFinite(validDays) || validDays < 0) {
      toast({ title: "Default valid days must be zero or more" });
      return;
    }
    try {
      await saveMutation.mutateAsync({
        invoice_prefix: values.invoice_prefix.trim() || "INV",
        quotation_prefix: values.quotation_prefix.trim() || "QT",
        has_branch_in_number: values.has_branch_in_number,
        number_padding: padding,
        default_due_days: dueDays,
        default_valid_days: validDays,
        default_tax: values.default_tax || null,
        invoice_terms: values.invoice_terms,
        invoice_footer: values.invoice_footer,
        quotation_terms: values.quotation_terms,
      });
      toast({ title: "Sales settings saved", variant: "success" });
    } catch (err) {
      toastError(toast, "Could not save sales settings", err);
    }
  }

  return (
    <FormShell onSubmit={handleSubmit} className="max-w-3xl">
      <FormSection
        title="Invoice defaults"
        description="Numbering, due dates, and text that new invoices start with."
      >
        <FormGrid>
          <FormField label="Invoice prefix" htmlFor="sales-invoice-prefix" span={4}>
            <FormInput
              id="sales-invoice-prefix"
              value={values.invoice_prefix}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  invoice_prefix: event.target.value,
                }))
              }
              maxLength={10}
            />
          </FormField>
          <FormField label="Number padding" htmlFor="sales-number-padding" span={4}>
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
          <FormField label="Default due days" htmlFor="sales-default-due-days" span={4}>
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
          <FormField label="Default tax" htmlFor="sales-default-tax" span={6}>
            <FormSelect
              id="sales-default-tax"
              options={taxOptions}
              value={values.default_tax}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  default_tax: event.target.value,
                }))
              }
            />
          </FormField>
          <FormField span={6}>
            <FormCheckbox
              id="sales-branch-in-number"
              label="Include branch code in invoice numbers"
              checked={values.has_branch_in_number}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  has_branch_in_number: event.target.checked,
                }))
              }
            />
          </FormField>
          <FormField label="Default terms" htmlFor="sales-invoice-terms" span={12}>
            <FormTextarea
              id="sales-invoice-terms"
              rows={3}
              value={values.invoice_terms}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  invoice_terms: event.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Invoice footer" htmlFor="sales-invoice-footer" span={12}>
            <FormTextarea
              id="sales-invoice-footer"
              rows={2}
              value={values.invoice_footer}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  invoice_footer: event.target.value,
                }))
              }
            />
          </FormField>
        </FormGrid>
      </FormSection>
      <FormSection
        title="Quotation defaults"
        description="Numbering, the validity window, and text that new quotations start with."
      >
        <FormGrid>
          <FormField label="Quotation prefix" htmlFor="sales-quotation-prefix" span={4}>
            <FormInput
              id="sales-quotation-prefix"
              value={values.quotation_prefix}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  quotation_prefix: event.target.value,
                }))
              }
              maxLength={10}
            />
          </FormField>
          <FormField
            label="Default valid days"
            htmlFor="sales-default-valid-days"
            span={4}
          >
            <FormInput
              id="sales-default-valid-days"
              type="number"
              min={0}
              value={values.default_valid_days}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  default_valid_days: event.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Default terms" htmlFor="sales-quotation-terms" span={12}>
            <FormTextarea
              id="sales-quotation-terms"
              rows={3}
              value={values.quotation_terms}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  quotation_terms: event.target.value,
                }))
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

function TaxesSection({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const taxesQuery = useTaxesQuery();
  const createMutation = useCreateTaxMutation();
  const updateMutation = useUpdateTaxMutation();
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const taxes = taxesQuery.data?.data ?? [];

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    const parsedRate = Number(rate);
    if (!trimmed) {
      toast({ title: "Tax name is required" });
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      toast({ title: "Rate must be between 0 and 100" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: trimmed,
        rate: parsedRate.toFixed(2),
        is_default: isDefault,
      });
      setName("");
      setRate("");
      setIsDefault(false);
      toast({ title: "Tax added", variant: "success" });
    } catch (err) {
      toastError(toast, "Could not add tax", err);
    }
  }

  async function setDefault(uuid: string) {
    try {
      await updateMutation.mutateAsync({ uuid, input: { is_default: true } });
      toast({ title: "Default tax updated", variant: "success" });
    } catch (err) {
      toastError(toast, "Could not update tax", err);
    }
  }

  async function toggleArchived(uuid: string, is_archived: boolean) {
    try {
      await updateMutation.mutateAsync({ uuid, input: { is_archived } });
      toast({
        title: is_archived ? "Tax archived" : "Tax restored",
        variant: "success",
      });
    } catch (err) {
      toastError(toast, "Could not update tax", err);
    }
  }

  return (
    <FormSection title="Taxes" description="Rates offered on invoices and quotations.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-erp-border text-left text-[11px] uppercase tracking-wide text-erp-muted">
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Rate</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-erp-muted">
                  {taxesQuery.isLoading ? "Loading taxes…" : "No taxes yet."}
                </td>
              </tr>
            ) : (
              taxes.map((tax) => (
                <tr
                  key={tax.uuid}
                  className="border-b border-erp-border-soft last:border-b-0"
                >
                  <td className="px-2 py-2.5 text-erp-text">
                    {tax.name}
                    {tax.is_default ? (
                      <span className="ms-2 text-[11px] text-erp-muted">Default</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5 text-erp-text">{tax.rate}%</td>
                  <td className="px-2 py-2.5 text-erp-muted">
                    {tax.is_archived ? "Archived" : "Active"}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    {canEdit ? (
                      <div className="inline-flex gap-1">
                        {!tax.is_default && !tax.is_archived ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void setDefault(tax.uuid)}
                            disabled={updateMutation.isPending}
                          >
                            Make default
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void toggleArchived(tax.uuid, !tax.is_archived)}
                          disabled={updateMutation.isPending}
                        >
                          {tax.is_archived ? "Restore" : "Archive"}
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canEdit ? (
        <form
          onSubmit={(event) => void handleAdd(event)}
          className="mt-4 grid gap-3 border-t border-erp-border-soft pt-4 min-[721px]:grid-cols-[1fr_8rem_auto_auto]"
        >
          <FormInput
            aria-label="Tax name"
            placeholder="Tax name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FormInput
            aria-label="Tax rate"
            placeholder="Rate %"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
          <FormCheckbox
            id="sales-tax-default"
            label="Default"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
          />
          <Button type="submit" variant="secondary" loading={createMutation.isPending}>
            Add tax
          </Button>
        </form>
      ) : null}
    </FormSection>
  );
}

function PaymentMethodsSection({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const methodsQuery = usePaymentMethodsQuery();
  const createMutation = useCreatePaymentMethodMutation();
  const updateMutation = useUpdatePaymentMethodMutation();
  const [name, setName] = useState("");
  const [methodType, setMethodType] = useState<PaymentMethodType>("cash");
  const [isDefault, setIsDefault] = useState(false);

  const methods = methodsQuery.data?.data ?? [];

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Payment method name is required" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: trimmed,
        method_type: methodType,
        is_default: isDefault,
      });
      setName("");
      setMethodType("cash");
      setIsDefault(false);
      toast({ title: "Payment method added", variant: "success" });
    } catch (err) {
      toastError(toast, "Could not add payment method", err);
    }
  }

  async function setDefault(uuid: string) {
    try {
      await updateMutation.mutateAsync({ uuid, input: { is_default: true } });
      toast({ title: "Default payment method updated", variant: "success" });
    } catch (err) {
      toastError(toast, "Could not update payment method", err);
    }
  }

  async function toggleArchived(uuid: string, is_archived: boolean) {
    try {
      await updateMutation.mutateAsync({ uuid, input: { is_archived } });
      toast({
        title: is_archived ? "Payment method archived" : "Payment method restored",
        variant: "success",
      });
    } catch (err) {
      toastError(toast, "Could not update payment method", err);
    }
  }

  return (
    <FormSection
      title="Payment methods"
      description="How customers pay — cash, bank, mobile money, and more."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-erp-border text-left text-[11px] uppercase tracking-wide text-erp-muted">
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Type</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {methods.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-erp-muted">
                  {methodsQuery.isLoading
                    ? "Loading payment methods…"
                    : "No payment methods yet."}
                </td>
              </tr>
            ) : (
              methods.map((method) => (
                <tr
                  key={method.uuid}
                  className="border-b border-erp-border-soft last:border-b-0"
                >
                  <td className="px-2 py-2.5 text-erp-text">
                    {method.name}
                    {method.is_default ? (
                      <span className="ms-2 text-[11px] text-erp-muted">Default</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5 text-erp-text">
                    {methodTypeLabel(method.method_type)}
                  </td>
                  <td className="px-2 py-2.5 text-erp-muted">
                    {method.is_archived ? "Archived" : "Active"}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    {canEdit ? (
                      <div className="inline-flex gap-1">
                        {!method.is_default && !method.is_archived ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void setDefault(method.uuid)}
                            disabled={updateMutation.isPending}
                          >
                            Make default
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            void toggleArchived(method.uuid, !method.is_archived)
                          }
                          disabled={updateMutation.isPending}
                        >
                          {method.is_archived ? "Restore" : "Archive"}
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canEdit ? (
        <form
          onSubmit={(event) => void handleAdd(event)}
          className="mt-4 grid gap-3 border-t border-erp-border-soft pt-4 min-[721px]:grid-cols-[1fr_10rem_auto_auto]"
        >
          <FormInput
            aria-label="Payment method name"
            placeholder="Payment method name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FormSelect
            aria-label="Payment method type"
            options={METHOD_TYPE_OPTIONS}
            value={methodType}
            onChange={(event) => setMethodType(event.target.value as PaymentMethodType)}
          />
          <FormCheckbox
            id="sales-method-default"
            label="Default"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
          />
          <Button type="submit" variant="secondary" loading={createMutation.isPending}>
            Add method
          </Button>
        </form>
      ) : null}
    </FormSection>
  );
}

/** Settings → Sales: invoicing defaults, taxes, and payment methods. */
export function SalesSettingsPanel() {
  const session = useSession();
  // Null/undefined codes = still loading or Storybook: offer controls; API still refuses.
  const codes = session?.permissions;
  const canEdit = codes == null || codes.includes("settings.sales.edit");
  const settingsQuery = useSalesSettingsQuery();

  if (settingsQuery.isLoading) {
    return (
      <div
        className="overflow-hidden rounded-sm border border-erp-border-soft bg-white p-6 text-sm text-erp-muted"
        role="tabpanel"
        aria-label="Sales settings"
      >
        Loading sales settings…
      </div>
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div
        className="overflow-hidden rounded-sm border border-erp-border-soft bg-white p-6 text-sm text-erp-muted"
        role="tabpanel"
        aria-label="Sales settings"
      >
        Could not load sales settings. Enable the Sales module and try again.
      </div>
    );
  }

  return (
    <div className="space-y-4" role="tabpanel" aria-label="Sales settings">
      <div className="overflow-hidden rounded-sm border border-erp-border-soft bg-white">
        <InvoiceDefaultsForm settings={settingsQuery.data} canEdit={canEdit} />
      </div>
      <div className="overflow-hidden rounded-sm border border-erp-border-soft bg-white">
        <TaxesSection canEdit={canEdit} />
      </div>
      <div className="overflow-hidden rounded-sm border border-erp-border-soft bg-white">
        <PaymentMethodsSection canEdit={canEdit} />
      </div>
    </div>
  );
}
