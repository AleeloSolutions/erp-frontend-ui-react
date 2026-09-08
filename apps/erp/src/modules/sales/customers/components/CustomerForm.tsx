/**
 * The customer form body, shared by the create and edit pages.
 *
 * One component rather than two copies: the two pages differ only in
 * where the values come from and what the save button does.
 */

import type { UseFormRegister } from "react-hook-form";
import {
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormTextarea,
  Radio,
} from "@erp/ui";
import type { CustomerFormValues } from "../schema";

export interface CustomerFormProps {
  register: UseFormRegister<CustomerFormValues>;
  errors: Partial<Record<keyof CustomerFormValues, { message?: string }>>;
  customerType: CustomerFormValues["customer_type"];
  onCustomerTypeChange: (value: CustomerFormValues["customer_type"]) => void;
}

export function CustomerForm({
  register,
  errors,
  customerType,
  onCustomerTypeChange,
}: CustomerFormProps) {
  return (
    <>
      <FormSection title="Basic information">
        <FormGrid columns={12}>
          <FormField label="Type" htmlFor="customer-type" span={12}>
            <div className="flex items-center gap-6 pt-1">
              <Radio
                id="customer-type-organization"
                name="customer-type"
                label="Organization"
                checked={customerType === "organization"}
                onChange={() => onCustomerTypeChange("organization")}
              />
              <Radio
                id="customer-type-person"
                name="customer-type"
                label="Person"
                checked={customerType === "person"}
                onChange={() => onCustomerTypeChange("person")}
              />
            </div>
          </FormField>
          <FormField
            label="Customer name"
            required
            htmlFor="customer-name"
            error={errors.name?.message}
            span={6}
          >
            <FormInput
              chrome="tick"
              chromeEdge="end"
              id="customer-name"
              error={Boolean(errors.name)}
              {...register("name")}
            />
          </FormField>
          <FormField
            label="Tax number"
            htmlFor="customer-tax-number"
            error={errors.tax_number?.message}
            span={6}
          >
            <FormInput id="customer-tax-number" {...register("tax_number")} />
          </FormField>
          <FormField
            label="Email"
            htmlFor="customer-email"
            error={errors.email?.message}
            span={6}
          >
            <FormInput
              id="customer-email"
              type="email"
              error={Boolean(errors.email)}
              {...register("email")}
            />
          </FormField>
          <FormField label="Phone" htmlFor="customer-phone" span={3}>
            <FormInput id="customer-phone" {...register("phone")} />
          </FormField>
          <FormField label="Mobile" htmlFor="customer-mobile" span={3}>
            <FormInput id="customer-mobile" {...register("mobile")} />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Billing">
        <FormGrid columns={12}>
          <FormField
            label="Currency"
            htmlFor="customer-currency"
            description="Three-letter code, e.g. USD."
            error={errors.currency?.message}
            span={3}
          >
            <FormInput
              id="customer-currency"
              maxLength={3}
              error={Boolean(errors.currency)}
              {...register("currency")}
            />
          </FormField>
          <FormField
            label="Payment terms"
            htmlFor="customer-terms"
            description="Days until an invoice falls due. Zero means on receipt."
            error={errors.payment_terms_days?.message}
            span={3}
          >
            <FormInput
              id="customer-terms"
              type="number"
              min={0}
              error={Boolean(errors.payment_terms_days)}
              {...register("payment_terms_days", { valueAsNumber: true })}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Address">
        <FormGrid columns={12}>
          <FormField label="Address line 1" htmlFor="customer-address1" span={6}>
            <FormInput id="customer-address1" {...register("address_line1")} />
          </FormField>
          <FormField label="Address line 2" htmlFor="customer-address2" span={6}>
            <FormInput id="customer-address2" {...register("address_line2")} />
          </FormField>
          <FormField label="City" htmlFor="customer-city" span={3}>
            <FormInput id="customer-city" {...register("city")} />
          </FormField>
          <FormField label="State or region" htmlFor="customer-state" span={3}>
            <FormInput id="customer-state" {...register("state")} />
          </FormField>
          <FormField label="Postal code" htmlFor="customer-postal" span={3}>
            <FormInput id="customer-postal" {...register("postal_code")} />
          </FormField>
          <FormField
            label="Country"
            htmlFor="customer-country"
            description="Two-letter code, e.g. SO."
            span={3}
          >
            <FormInput id="customer-country" maxLength={2} {...register("country")} />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Notes">
        <FormGrid columns={12}>
          <FormField label="Notes" htmlFor="customer-notes" span={12}>
            <FormTextarea id="customer-notes" {...register("notes")} />
          </FormField>
        </FormGrid>
      </FormSection>
    </>
  );
}
