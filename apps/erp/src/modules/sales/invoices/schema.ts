import { z } from "zod";

export const invoiceFormSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["Draft", "Posted"], {
    message: "Status is required",
  }),
  paymentStatus: z.enum(["Not Paid", "Partially Paid", "Paid", "Overdue"], {
    message: "Payment status is required",
  }),
  notes: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export interface InvoiceLineFormValue {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

let nextLineId = 1;

export function createEmptyInvoiceLine(): InvoiceLineFormValue {
  return {
    id: `new-${nextLineId++}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}
