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
import type { CompanyInfo } from "./settingsCompany";

export interface CompanyInfoFormProps {
  initialValues: CompanyInfo;
}

export function CompanyInfoForm({ initialValues }: CompanyInfoFormProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<CompanyInfo>(initialValues);

  function updateField<K extends keyof CompanyInfo>(key: K, value: CompanyInfo[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast({
      title: "Company info saved",
      description: "Changes are stored locally for now.",
      variant: "success",
    });
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
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </FormShell>
  );
}
