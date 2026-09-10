import { useState } from "react";
import {
  Button,
  FormField,
  FormGrid,
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
  TIMEZONE_OPTIONS,
  withCurrentValue,
  type CompanyInfo,
} from "../settingsCompany";

export interface LanguageSettingsFormProps {
  initialValues: CompanyInfo;
  onSave?: (values: CompanyInfo) => Promise<void>;
}

export function LanguageSettingsForm({
  initialValues,
  onSave,
}: LanguageSettingsFormProps) {
  const { toast } = useToast();
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof CompanyInfo>(key: K, value: CompanyInfo[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSave) {
      toast({
        title: "Language settings saved",
        description: "Changes are stored locally for now.",
        variant: "success",
      });
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
      toast({ title: "Language settings saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not save language settings",
        description:
          err instanceof ApiError ? err.message : "Please try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormShell onSubmit={handleSubmit} className="max-w-3xl">
      <FormSection
        title="Localization"
        description="Drives formatting, currency and scheduled jobs."
      >
        <FormGrid>
          <FormField label="Language" htmlFor="settings-language" span={6}>
            <FormSelect
              id="settings-language"
              name="language"
              options={withCurrentValue(LANGUAGE_OPTIONS, values.language)}
              value={values.language}
              onChange={(event) => updateField("language", event.target.value)}
            />
          </FormField>
          <FormField label="Country" htmlFor="settings-country" span={6}>
            <FormSelect
              id="settings-country"
              name="country"
              options={withCurrentValue(COUNTRY_OPTIONS, values.country)}
              value={values.country}
              onChange={(event) => updateField("country", event.target.value)}
            />
          </FormField>
          <FormField label="Timezone" htmlFor="settings-timezone" span={6}>
            <FormSelect
              id="settings-timezone"
              name="timezone"
              options={withCurrentValue(TIMEZONE_OPTIONS, values.timezone)}
              value={values.timezone}
              onChange={(event) => updateField("timezone", event.target.value)}
            />
          </FormField>
          <FormField label="Currency" htmlFor="settings-currency" span={6}>
            <FormSelect
              id="settings-currency"
              name="currency"
              options={withCurrentValue(CURRENCY_OPTIONS, values.currency)}
              value={values.currency}
              onChange={(event) => updateField("currency", event.target.value)}
            />
          </FormField>
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
