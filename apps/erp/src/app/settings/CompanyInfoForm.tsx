import { useState } from "react";
import {
  Button,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  useToast,
} from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  PRIMARY_INTEREST_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIMEZONE_OPTIONS,
  withCurrentValue,
  type CompanyInfo,
} from "./settingsCompany";

export interface CompanyInfoFormProps {
  initialValues: CompanyInfo;
  /** Persist to the backend; omitted (e.g. Storybook) = local-only demo. */
  onSave?: (values: CompanyInfo) => Promise<void>;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-12 sm:col-span-6">
      <div className="text-[11px] uppercase tracking-wide text-erp-muted">{label}</div>
      <div className="mt-1 text-sm text-erp-text">{value}</div>
    </div>
  );
}

export function CompanyInfoForm({ initialValues, onSave }: CompanyInfoFormProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<CompanyInfo>(initialValues);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof CompanyInfo>(key: K, value: CompanyInfo[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSave) {
      toast({
        title: "Company info saved",
        description: "Changes are stored locally for now.",
        variant: "success",
      });
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
      toast({ title: "Company info saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not save company info",
        description:
          err instanceof ApiError ? err.message : "Please try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormShell onSubmit={handleSubmit} className="max-w-3xl">
      <FormSection title="Company identity" description="Legal name and address.">
        <FormGrid>
          <FormField label="Company name" htmlFor="company-name" required span={12}>
            <FormInput
              id="company-name"
              name="companyName"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </FormField>
          <FormField label="Address line 1" htmlFor="company-address-line1" span={12}>
            <FormInput
              id="company-address-line1"
              name="addressLine1"
              value={values.addressLine1}
              onChange={(event) => updateField("addressLine1", event.target.value)}
            />
          </FormField>
          <FormField label="Address line 2" htmlFor="company-address-line2" span={12}>
            <FormInput
              id="company-address-line2"
              name="addressLine2"
              value={values.addressLine2}
              onChange={(event) => updateField("addressLine2", event.target.value)}
            />
          </FormField>
          <FormField label="City" htmlFor="company-city" span={6}>
            <FormInput
              id="company-city"
              name="city"
              value={values.city}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </FormField>
          <FormField label="State / region" htmlFor="company-state" span={3}>
            <FormInput
              id="company-state"
              name="state"
              value={values.state}
              onChange={(event) => updateField("state", event.target.value)}
            />
          </FormField>
          <FormField label="Postal code" htmlFor="company-postal-code" span={3}>
            <FormInput
              id="company-postal-code"
              name="postalCode"
              value={values.postalCode}
              onChange={(event) => updateField("postalCode", event.target.value)}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Tax & contact" description="Shown on printed documents.">
        <FormGrid>
          <FormField label="Tax number" htmlFor="company-tax-number" span={6}>
            <FormInput
              id="company-tax-number"
              name="taxNumber"
              value={values.taxNumber}
              onChange={(event) => updateField("taxNumber", event.target.value)}
            />
          </FormField>
          <FormField label="Phone" htmlFor="company-phone" span={6}>
            <FormInput
              id="company-phone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </FormField>
          <FormField label="Email" htmlFor="company-email" span={12}>
            <FormInput
              id="company-email"
              name="email"
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Localization"
        description="Drives formatting, currency and scheduled jobs."
      >
        <FormGrid>
          <FormField label="Language" htmlFor="company-language" span={6}>
            <FormSelect
              id="company-language"
              name="language"
              options={withCurrentValue(LANGUAGE_OPTIONS, values.language)}
              value={values.language}
              onChange={(event) => updateField("language", event.target.value)}
            />
          </FormField>
          <FormField label="Country" htmlFor="company-country" span={6}>
            <FormSelect
              id="company-country"
              name="country"
              options={withCurrentValue(COUNTRY_OPTIONS, values.country)}
              value={values.country}
              onChange={(event) => updateField("country", event.target.value)}
            />
          </FormField>
          <FormField label="Timezone" htmlFor="company-timezone" span={6}>
            <FormSelect
              id="company-timezone"
              name="timezone"
              options={withCurrentValue(TIMEZONE_OPTIONS, values.timezone)}
              value={values.timezone}
              onChange={(event) => updateField("timezone", event.target.value)}
            />
          </FormField>
          <FormField label="Currency" htmlFor="company-currency" span={6}>
            <FormSelect
              id="company-currency"
              name="currency"
              options={withCurrentValue(CURRENCY_OPTIONS, values.currency)}
              value={values.currency}
              onChange={(event) => updateField("currency", event.target.value)}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Profile" description="Captured at signup; editable here.">
        <FormGrid>
          <FormField label="Company size" htmlFor="company-size" span={6}>
            <FormSelect
              id="company-size"
              name="teamSize"
              options={withCurrentValue(TEAM_SIZE_OPTIONS, values.teamSize)}
              value={values.teamSize}
              onChange={(event) => updateField("teamSize", event.target.value)}
            />
          </FormField>
          <FormField label="Primary interest" htmlFor="company-interest" span={6}>
            <FormSelect
              id="company-interest"
              name="primaryInterest"
              options={withCurrentValue(PRIMARY_INTEREST_OPTIONS, values.primaryInterest)}
              value={values.primaryInterest}
              onChange={(event) => updateField("primaryInterest", event.target.value)}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Workspace"
        description="Set when the workspace was created — not editable here."
      >
        <FormGrid>
          <ReadOnlyValue label="Domain" value={values.slug} />
          <ReadOnlyValue label="Status" value={values.status} />
          <ReadOnlyValue label="Trial ends" value={formatDate(values.trialEndsAt)} />
        </FormGrid>
      </FormSection>

      <div className="flex justify-end border-t border-erp-border px-[13px] py-3">
        <Button type="submit" variant="primary" loading={saving}>
          Save
        </Button>
      </div>
    </FormShell>
  );
}
