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
  customerReference: z.string().optional(),
  salesperson: z.string().optional(),
  salesTeam: z.string().optional(),
  recipientBank: z.string().optional(),
  paymentReference: z.string().optional(),
  deliveryDate: z.string().optional(),
  incoterm: z.string().optional(),
  incotermLocation: z.string().optional(),
  fiscalPosition: z.string().optional(),
  paymentMethod: z.string().optional(),
  autoPost: z.enum(["No", "Yes"]).optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export interface InvoiceLineFormValue {
  id: string;
  /** `section` / `note` rows merge the row into a single free-text cell (Odoo-style). */
  kind: "product" | "section" | "note";
  /** Selected product catalog id, or free text when no catalog match (`allowFreeText`). */
  product: string;
  description: string;
  /** GL account code, e.g. "400000 Product Sales". */
  account: string;
  quantity: number;
  unitPrice: number;
  /** Tax percentage, e.g. 15. 0 = no tax. */
  taxRate: number;
}

let nextLineId = 1;

export function createEmptyInvoiceLine(): InvoiceLineFormValue {
  return {
    id: `new-${nextLineId++}`,
    kind: "product",
    product: "",
    description: "",
    account: "400000 Product Sales",
    quantity: 1,
    unitPrice: 0,
    taxRate: 15,
  };
}

export function createInvoiceSectionLine(): InvoiceLineFormValue {
  return {
    ...createEmptyInvoiceLine(),
    kind: "section",
    account: "",
    quantity: 0,
    unitPrice: 0,
    taxRate: 0,
  };
}

export function createInvoiceNoteLine(): InvoiceLineFormValue {
  return {
    ...createEmptyInvoiceLine(),
    kind: "note",
    account: "",
    quantity: 0,
    unitPrice: 0,
    taxRate: 0,
  };
}
