import { z } from "zod";
import type { Product, ProductInput } from "./api";

/**
 * The product form.
 *
 * Money stays a string the whole way: the API takes decimals as strings, and
 * parsing them into floats here would only lose what the user typed.
 */
export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  code: z.string(),
  unit_price: z.string(),
  /** A tax uuid, or "" for no tax — a `<select>` has no null. */
  default_tax: z.string(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  code: "",
  unit_price: "0.00",
  default_tax: "",
};

export function toProductFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    code: product.code,
    unit_price: product.unit_price,
    default_tax: product.default_tax ?? "",
  };
}

/** Form values as the API wants them: trimmed, and "no tax" back to null. */
export function toProductInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    unit_price: values.unit_price.trim() || "0.00",
    default_tax: values.default_tax || null,
  };
}
