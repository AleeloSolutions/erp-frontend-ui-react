import { z } from "zod";

export const quotationFormSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  status: z.enum(["Draft", "Pending", "Approved"], {
    message: "Status is required",
  }),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "Amount must be a positive number",
    }),
  notes: z.string().optional(),
});

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;
