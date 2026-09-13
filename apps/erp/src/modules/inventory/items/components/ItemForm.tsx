/**
 * The item form body, shared by the create and edit pages.
 *
 * One component rather than two copies: the two pages differ only in
 * where the values come from, what the save button does, and what stock
 * means. On create it is opening stock and may be typed; afterwards it is
 * on-hand, which only a movement changes, so it is shown and not asked for.
 */

import type { UseFormRegister } from "react-hook-form";
import {
  FormDropdown,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormSwitch,
  FormTextarea,
} from "@erp/ui";
import type { CategoryRef } from "../api";
import type { ItemFormValues } from "../schema";

export interface ItemFormProps {
  register: UseFormRegister<ItemFormValues>;
  errors: Partial<Record<keyof ItemFormValues, { message?: string }>>;
  categoryUuid: string;
  onCategoryChange: (value: string) => void;
  categories: CategoryRef[];
  categoriesLoading?: boolean;
  categoriesError?: boolean;
  /** Create: opening stock is typed. Edit: on-hand is shown. */
  mode: "create" | "edit";
  /** On-hand as the server holds it; edit mode only. */
  onHand?: string;
  /** When true, every control is non-interactive (view-only). */
  readOnly?: boolean;
}

function categoryDescription(
  loading: boolean,
  failed: boolean,
  count: number
): string | undefined {
  if (failed) return "Categories could not be loaded.";
  if (!loading && count === 0) return "No categories yet — add one under Categories.";
  return undefined;
}

export function ItemForm({
  register,
  errors,
  categoryUuid,
  onCategoryChange,
  categories,
  categoriesLoading = false,
  categoriesError = false,
  mode,
  onHand,
  readOnly = false,
}: ItemFormProps) {
  return (
    <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
      <FormSection title="Basic information">
        <FormGrid columns={12}>
          <FormField
            label="Item name"
            required
            htmlFor="item-name"
            error={errors.name?.message}
            span={6}
          >
            <FormInput
              chrome="tick"
              chromeEdge="end"
              id="item-name"
              error={Boolean(errors.name)}
              {...register("name")}
            />
          </FormField>
          <FormField
            label="Category"
            htmlFor="item-category"
            description={categoryDescription(
              categoriesLoading,
              categoriesError,
              categories.length
            )}
            span={6}
          >
            <FormDropdown
              id="item-category"
              searchable
              clearable
              placeholder="No category"
              disabled={readOnly || categoriesLoading}
              value={categoryUuid || null}
              items={categories.map((category) => ({
                key: category.uuid,
                label: category.name,
              }))}
              onChange={(key) => onCategoryChange(key ?? "")}
            />
          </FormField>
          <FormField label="SKU" htmlFor="item-sku" error={errors.sku?.message} span={4}>
            <FormInput id="item-sku" error={Boolean(errors.sku)} {...register("sku")} />
          </FormField>
          <FormField label="Barcode" htmlFor="item-barcode" span={4}>
            <FormInput id="item-barcode" {...register("barcode")} />
          </FormField>
          <FormField
            label="Unit"
            htmlFor="item-unit"
            description="How it is counted, e.g. pcs or kg."
            span={4}
          >
            <FormInput id="item-unit" {...register("unit")} />
          </FormField>
          <FormField label="Description" htmlFor="item-description" span={12}>
            <FormTextarea id="item-description" {...register("description")} />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Pricing">
        <FormGrid columns={12}>
          <FormField
            label="Cost price"
            htmlFor="item-cost-price"
            error={errors.cost_price?.message}
            span={3}
          >
            <FormInput
              id="item-cost-price"
              inputMode="decimal"
              error={Boolean(errors.cost_price)}
              {...register("cost_price")}
            />
          </FormField>
          <FormField
            label="Sale price"
            htmlFor="item-sale-price"
            error={errors.sale_price?.message}
            span={3}
          >
            <FormInput
              id="item-sale-price"
              inputMode="decimal"
              error={Boolean(errors.sale_price)}
              {...register("sale_price")}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="Stock">
        <FormGrid columns={12}>
          {mode === "create" ? (
            <FormField
              label="Opening stock"
              htmlFor="item-quantity"
              description="What is on the shelf today. Afterwards only a movement changes it."
              error={errors.quantity?.message}
              span={3}
            >
              <FormInput
                id="item-quantity"
                inputMode="decimal"
                error={Boolean(errors.quantity)}
                {...register("quantity")}
              />
            </FormField>
          ) : (
            <FormField
              label="On hand"
              description="Changed by stock movements, never edited here."
              span={3}
            >
              <p className="m-0 flex h-8 items-center text-[12px] text-erp-text">
                {onHand ?? "—"}
              </p>
            </FormField>
          )}
          <FormField
            label="Reorder level"
            htmlFor="item-reorder-level"
            description="On-hand at or below this is flagged as low."
            error={errors.reorder_level?.message}
            span={3}
          >
            <FormInput
              id="item-reorder-level"
              inputMode="decimal"
              error={Boolean(errors.reorder_level)}
              {...register("reorder_level")}
            />
          </FormField>
          <FormField label="Track inventory" htmlFor="item-is-tracked" span={6}>
            <div className="flex h-8 items-center">
              <FormSwitch
                id="item-is-tracked"
                label="Keep a stock count for this item"
                {...register("is_tracked")}
              />
            </div>
          </FormField>
        </FormGrid>
      </FormSection>
    </fieldset>
  );
}
