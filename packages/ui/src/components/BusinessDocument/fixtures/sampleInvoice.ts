import logoUrl from "./germany-ltd-logo.png";
import type { DocumentData, DocumentItem } from "../types/document";
import { computeDocumentTotals } from "../lib/computeTotals";

/**
 * The reference invoice the Dual layout was built against — line items are
 * unchanged from that original so the two can still be pixel-compared. The
 * customer is a placeholder: fixtures ship inside the package and must not
 * carry anyone's real name or address.
 */
const rawItems: Array<Omit<DocumentItem, "amount">> = [
  {
    id: "1",
    description: "[DELIVERY] Delivery Fee (Self-order)",
    quantity: 1,
    unitPrice: 10,
    taxRate: 15,
  },
  { id: "2", description: "Deposit", quantity: 1, unitPrice: 12 },
  { id: "3", description: "Booking Fees", quantity: 1, unitPrice: 50, taxRate: 15 },
  { id: "4", description: "Down Payment (POS)", quantity: 1, unitPrice: 10 },
  { id: "5", description: "Room Service", quantity: 2, unitPrice: 8, taxRate: 15 },
  { id: "6", description: "Laundry Service", quantity: 1, unitPrice: 6 },
  { id: "7", description: "Late Checkout Fee", quantity: 1, unitPrice: 15, taxRate: 15 },
  { id: "8", description: "Minibar Charges", quantity: 3, unitPrice: 4 },
  { id: "9", description: "Parking Fee", quantity: 1, unitPrice: 5 },
  { id: "10", description: "City Tax", quantity: 1, unitPrice: 3 },
];

const items: DocumentItem[] = rawItems.map((item) => ({
  ...item,
  amount: item.quantity * item.unitPrice,
}));

export const sampleInvoice: DocumentData = {
  company: {
    name: "Germany LTD.",
    logoUrl,
    address: "Somalia",
    taxId: "978897",
  },
  customer: {
    name: "SAMPLE CUSTOMER",
    email: "CUSTOMER@EXAMPLE.COM",
  },
  invoice: {
    number: "INV/2026/00010",
    date: "08/25/2026",
    dueDate: "09/09/2026",
    paymentTerms: "15 Days",
    accountNumber: "52426543",
  },
  items,
  totals: computeDocumentTotals(items, "Sh."),
};

/** Shorter sample for document-layout modal preview — four readable line items. */
const previewItems = items.slice(0, 4);

export const sampleInvoicePreview: DocumentData = {
  ...sampleInvoice,
  items: previewItems,
  totals: computeDocumentTotals(previewItems, "Sh."),
};
