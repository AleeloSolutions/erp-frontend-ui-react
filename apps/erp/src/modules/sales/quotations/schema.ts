import { z } from "zod";

export const quotationFormSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  status: z.enum(["Draft", "Pending", "Approved"], {
    message: "Status is required",
  }),
  notes: z.string().optional(),
});

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;

export interface QuotationLineFormValue {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

let nextLineId = 1;

export function createEmptyQuotationLine(): QuotationLineFormValue {
  return {
    id: `new-${nextLineId++}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}
