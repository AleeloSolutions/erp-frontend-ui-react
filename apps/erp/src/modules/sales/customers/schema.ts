import { z } from "zod";

/**
 * The customer form.
 *
 * Only shape is checked here; the business rules live in the API, which
 * is also the only thing that can tell you a name is already taken.
 * Email and phone are optional because a walk-in customer often has
 * neither, and refusing the sale over it would be absurd.
 */
export const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  customer_type: z.enum(["organization", "person"]),
  email: z.union([z.literal(""), z.string().email("Invalid email")]),
  phone: z.string(),
  mobile: z.string(),
  tax_number: z.string(),
  currency: z.string().length(3, "Use a three-letter code, e.g. USD"),
  payment_terms_days: z.number().int().min(0).max(365),
  address_line1: z.string(),
  address_line2: z.string(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string(),
  notes: z.string(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const EMPTY_CUSTOMER: CustomerFormValues = {
  name: "",
  customer_type: "organization",
  email: "",
  phone: "",
  mobile: "",
  tax_number: "",
  currency: "USD",
  payment_terms_days: 0,
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  notes: "",
};
