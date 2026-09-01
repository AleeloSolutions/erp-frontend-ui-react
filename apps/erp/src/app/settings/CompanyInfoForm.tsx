import { useState } from "react";
import {
  Button,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormShell,
  FormTextarea,
  useToast,
} from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import type { CompanyInfo } from "./settingsCompany";

export interface CompanyInfoFormProps {
  initialValues: CompanyInfo;
  /** Persist to the backend; omitted (e.g. Storybook) = local-only demo. */
  onSave?: (values: CompanyInfo) => Promise<void>;
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
      <FormSection title="Company identity" description="Legal name and contact details.">
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
          <FormField label="Address" htmlFor="company-address" span={12}>
            <FormTextarea
              id="company-address"
              name="address"
              rows={3}
              value={values.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Tax & contact">
        <FormGrid>
          <FormField label="Tax ID" htmlFor="company-tax-id" span={6}>
            <FormInput
              id="company-tax-id"
              name="taxId"
              value={values.taxId}
              onChange={(event) => updateField("taxId", event.target.value)}
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

      <div className="flex justify-end border-t border-erp-border px-[13px] py-3">
        <Button type="submit" variant="primary" loading={saving}>
          Save
        </Button>
      </div>
    </FormShell>
  );
}
