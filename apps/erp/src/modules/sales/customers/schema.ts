import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phone: z.string().min(7, "Phone number is required"),
  status: z.enum(["Active", "Inactive"], {
    message: "Status is required",
  }),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
