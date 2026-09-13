/**
 * The category form body, shared by the create and edit pages.
 *
 * One component rather than two copies: the two pages differ only in
 * where the values come from and what the save button does.
 */

import type { UseFormRegister } from "react-hook-form";
import { FormField, FormGrid, FormInput, FormSection } from "@erp/ui";
import type { CategoryFormValues } from "../schema";

export interface CategoryFormProps {
  register: UseFormRegister<CategoryFormValues>;
  errors: Partial<Record<keyof CategoryFormValues, { message?: string }>>;
  /** When true, every control is non-interactive (view-only). */
  readOnly?: boolean;
}

export function CategoryForm({ register, errors, readOnly = false }: CategoryFormProps) {
  return (
    <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
      <FormSection title="Category">
        <FormGrid columns={12}>
          <FormField
            label="Category name"
            required
            htmlFor="category-name"
            error={errors.name?.message}
            span={6}
          >
            <FormInput
              chrome="tick"
              chromeEdge="end"
              id="category-name"
              error={Boolean(errors.name)}
              {...register("name")}
            />
          </FormField>
        </FormGrid>
      </FormSection>
    </fieldset>
  );
}
