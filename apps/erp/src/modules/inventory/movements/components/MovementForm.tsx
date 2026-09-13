/**
 * New stock movement form body.
 */

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FormField, FormGrid, FormInput, FormSection, FormSelect, FormTextarea } from "@erp/ui";
import type { Item } from "../../items/api";
import { MOVEMENT_TYPE_LABELS, type MovementFormValues } from "../schema";

export interface MovementFormProps {
  register: UseFormRegister<MovementFormValues>;
  setValue: UseFormSetValue<MovementFormValues>;
  watch: UseFormWatch<MovementFormValues>;
  errors: Partial<Record<keyof MovementFormValues, { message?: string }>>;
  items: Item[];
  readOnly?: boolean;
}

export function MovementForm({
  register,
  setValue,
  watch,
  errors,
  items,
  readOnly = false,
}: MovementFormProps) {
  const movementType = watch("movement_type");
  const quantityHint =
    movementType === "adjust"
      ? "New on-hand quantity after the count."
      : movementType === "out"
        ? "Amount to remove from stock."
        : "Amount to add to stock.";

  return (
    <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
      <FormSection title="Movement">
        <FormGrid columns={12}>
          <FormField
            label="Item"
            required
            htmlFor="movement-item"
            error={errors.item_uuid?.message}
            span={6}
          >
            <FormSelect
              chrome="tick"
              chromeEdge="end"
              id="movement-item"
              error={Boolean(errors.item_uuid)}
              value={watch("item_uuid")}
              onChange={(event) =>
                setValue("item_uuid", event.target.value, { shouldValidate: true })
              }
            >
              <option value="">Select an item…</option>
              {items.map((item) => (
                <option key={item.uuid} value={item.uuid}>
                  {item.name}
                  {item.sku ? ` (${item.sku})` : ""}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField
            label="Type"
            required
            htmlFor="movement-type"
            error={errors.movement_type?.message}
            span={3}
          >
            <FormSelect
              chrome="tick"
              chromeEdge="end"
              id="movement-type"
              error={Boolean(errors.movement_type)}
              {...register("movement_type")}
            >
              {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField
            label="Quantity"
            required
            htmlFor="movement-quantity"
            error={errors.quantity?.message}
            description={quantityHint}
            span={3}
          >
            <FormInput
              chrome="tick"
              chromeEdge="end"
              id="movement-quantity"
              type="number"
              min="0"
              step="any"
              error={Boolean(errors.quantity)}
              {...register("quantity")}
            />
          </FormField>
          <FormField
            label="Note"
            htmlFor="movement-note"
            error={errors.note?.message}
            span={12}
          >
            <FormTextarea id="movement-note" rows={3} {...register("note")} />
          </FormField>
        </FormGrid>
      </FormSection>
    </fieldset>
  );
}
