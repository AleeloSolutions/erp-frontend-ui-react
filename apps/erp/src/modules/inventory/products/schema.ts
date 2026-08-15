import { z } from "zod";

const positiveNumberString = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: `${label} must be a valid number`,
    });

export const productFormSchema = z.object({
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(32, "SKU must be 32 characters or fewer"),
  name: z.string().min(1, "Product name is required"),
  category: z.enum(
    ["Office", "Electronics", "Consumables", "Services", "Raw materials"],
    { message: "Category is required" }
  ),
  unit: z.enum(["ea", "box", "kg", "liter", "hour", "set"], {
    message: "Unit is required",
  }),
  unitPrice: positiveNumberString("Unit price"),
  costPrice: positiveNumberString("Cost price"),
  stockQty: positiveNumberString("Stock quantity"),
  reorderLevel: positiveNumberString("Reorder level"),
  status: z.enum(["Active", "Inactive", "Discontinued"], {
    message: "Status is required",
  }),
  barcode: z.string().optional(),
  description: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const productCategoryOptions = [
  { label: "Office", value: "Office" },
  { label: "Electronics", value: "Electronics" },
  { label: "Consumables", value: "Consumables" },
  { label: "Services", value: "Services" },
  { label: "Raw materials", value: "Raw materials" },
] as const;

export const productUnitOptions = [
  { label: "Each (ea)", value: "ea" },
  { label: "Box", value: "box" },
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Liter", value: "liter" },
  { label: "Hour", value: "hour" },
  { label: "Set", value: "set" },
] as const;

export const productStatusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Discontinued", value: "Discontinued" },
] as const;
