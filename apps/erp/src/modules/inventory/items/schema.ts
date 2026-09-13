import { z } from "zod";

/**
 * The item form.
 *
 * Only shape is checked here; the business rules live in the API, which
 * is also the only thing that can tell you a SKU is already taken.
 * Prices and quantities stay strings the whole way — they are decimals on
 * the backend, and parsing "0.1" into a float here is how a cent goes
 * missing between the screen and the ledger.
 *
 * `quantity` is opening stock, and only the create form sends it: once an
 * item exists, on-hand moves through a stock movement and nothing else.
 */
export const itemFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  sku: z.string(),
  barcode: z.string(),
  description: z.string(),
  unit: z.string(),
  cost_price: z.string(),
  sale_price: z.string(),
  quantity: z.string(),
  reorder_level: z.string(),
  is_tracked: z.boolean(),
  /** Empty means no category. */
  category_uuid: z.string(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const EMPTY_ITEM: ItemFormValues = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  unit: "",
  cost_price: "0",
  sale_price: "0",
  quantity: "0",
  reorder_level: "0",
  is_tracked: true,
  category_uuid: "",
};

/** On-hand at or below the reorder level: what the list marks. */
export function isLowStock(quantity: string, reorderLevel: string): boolean {
  const onHand = Number(quantity);
  const level = Number(reorderLevel);
  if (Number.isNaN(onHand) || Number.isNaN(level) || level <= 0) return false;
  return onHand <= level;
}
