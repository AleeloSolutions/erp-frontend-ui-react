import logoUrl from "@/modules/sales/assets/germany-ltd-logo.png";
import type { InvoiceData, InvoiceItem } from "../types/invoice";
import { computeInvoiceTotals } from "../lib/computeTotals";

/** Same reference invoice as the pre-refactor Classic story, so the two can be pixel-compared. */
const rawItems: Array<Omit<InvoiceItem, "amount">> = [
  { id: "1", description: "Default Product (POS)", quantity: 1, unitPrice: 10 },
  { id: "2", description: "Espresso Shot", quantity: 3, unitPrice: 2.5 },
  { id: "3", description: "Cappuccino", quantity: 2, unitPrice: 3.5 },
  { id: "4", description: "Croissant", quantity: 4, unitPrice: 2 },
  { id: "5", description: "Iced Latte", quantity: 2, unitPrice: 4 },
  { id: "6", description: "Bottled Water", quantity: 5, unitPrice: 1 },
  { id: "7", description: "Chocolate Muffin", quantity: 3, unitPrice: 2.75 },
  { id: "8", description: "Service Fee", quantity: 1, unitPrice: 5 },
  { id: "9", description: "Loyalty Discount", quantity: 1, unitPrice: 3 },
  { id: "10", description: "Takeaway Cup Fee", quantity: 1, unitPrice: 0.5 },
];

const items: InvoiceItem[] = rawItems.map((item) => ({
  ...item,
  amount: item.quantity * item.unitPrice,
}));

export const mockInvoiceDataClassic: InvoiceData = {
  company: {
    name: "Germany LTD.",
    logoUrl,
    address: "Somalia",
    taxId: "978897",
  },
  customer: {
    name: "AZIZ DAHIR",
    email: "ABDIAZIZ4C@GMAIL.COM",
  },
  invoice: {
    number: "INV/2026/00008",
    date: "08/24/2026",
    dueDate: "08/24/2026",
  },
  items,
  // None of these items carry a taxRate, so taxLines computes to empty —
  // matching the original Classic component, which never showed a tax
  // breakdown to begin with (StripedTable only ever renders the flat Total).
  totals: computeInvoiceTotals(items, "Sh."),
};
