import type { Meta, StoryObj } from "@storybook/react";
import { Printer } from "lucide-react";
import { Button } from "@erp/ui";
import { InvoicePrintDocumentBackground } from "./InvoicePrintDocumentBackground";

/**
 * Odoo "Background" layout replica (company "Germany LTD.", Somalia) —
 * compact header (tagline + small logo, address/tax ID under it), a
 * bordered 3-column line-items table (Description/Quantity/Amount), and a
 * bordered totals box (Untaxed Amount / per-rate Tax / Total). The footer
 * (shape + email + page number) is pinned to the bottom of the A4 page via
 * a flex column layout, regardless of how many line items precede it.
 * 10 lines here to stress-test that. The toolbar's Print button is hidden
 * on paper via `print:hidden` so only the document itself prints.
 */
const meta = {
  title: "Pages/Invoice",
  component: InvoicePrintDocumentBackground,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div>
        {/* Storybook's global preview decorator wraps every story in a
         * `p-4` div that isn't print-aware, which pushes this A4-height
         * document past one physical page. Neutralize it during print. */}
        <style>
          {
            "@media print { #storybook-root > div { padding: 0 !important; min-height: 0 !important; } }"
          }
        </style>
        <div className="flex justify-end border-b border-erp-border bg-erp-surface px-4 py-2 print:hidden">
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" aria-hidden /> Print
          </Button>
        </div>
        <div className="bg-erp-bg py-8 print:bg-white print:py-0">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof InvoicePrintDocumentBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrintBackground: Story = {
  args: {
    invoice: {
      number: "INV/2026/00010",
      date: "08/25/2026",
      dueDate: "09/09/2026",
      customer: "ABDIFATAH MOAHMED",
      customerEmail: "ABDIAZIZ4C@GMAIL.COM",
      paymentTerms: "15 Days",
      accountNumber: "52426543",
      lines: [
        {
          id: "1",
          description: "[DELIVERY] Delivery Fee (Self-order)",
          quantity: 1,
          unitPrice: 10,
          taxRate: 15,
        },
        {
          id: "2",
          description: "Deposit",
          quantity: 1,
          unitPrice: 12,
        },
        {
          id: "3",
          description: "Booking Fees",
          quantity: 1,
          unitPrice: 50,
          taxRate: 15,
        },
        {
          id: "4",
          description: "Down Payment (POS)",
          quantity: 1,
          unitPrice: 10,
        },
        {
          id: "5",
          description: "Room Service",
          quantity: 2,
          unitPrice: 8,
          taxRate: 15,
        },
        {
          id: "6",
          description: "Laundry Service",
          quantity: 1,
          unitPrice: 6,
        },
        {
          id: "7",
          description: "Late Checkout Fee",
          quantity: 1,
          unitPrice: 15,
          taxRate: 15,
        },
        {
          id: "8",
          description: "Minibar Charges",
          quantity: 3,
          unitPrice: 4,
        },
        {
          id: "9",
          description: "Parking Fee",
          quantity: 1,
          unitPrice: 5,
        },
        {
          id: "10",
          description: "City Tax",
          quantity: 1,
          unitPrice: 3,
        },
      ],
    },
  },
};
