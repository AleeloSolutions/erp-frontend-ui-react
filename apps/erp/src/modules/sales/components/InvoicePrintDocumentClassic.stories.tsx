import type { Meta, StoryObj } from "@storybook/react";
import { Printer } from "lucide-react";
import { Button } from "@erp/ui";
import { InvoicePrintDocumentClassic } from "./InvoicePrintDocumentClassic";

/**
 * Exact-match replica of a specific Odoo invoice report (company
 * "Germany LTD.", Somalia) — real reference data (INV/2026/00008), not the
 * app's mock invoices, since the point is pixel fidelity to that design.
 * 10 lines to exercise the A4 layout (footer pinned to the page bottom
 * regardless of row count). The toolbar's Print button is hidden on paper
 * via `print:hidden` so only the document itself prints.
 */
const meta = {
  title: "Pages/Invoice",
  component: InvoicePrintDocumentClassic,
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
} satisfies Meta<typeof InvoicePrintDocumentClassic>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrintClassic: Story = {
  args: {
    invoice: {
      number: "INV/2026/00008",
      date: "08/24/2026",
      dueDate: "08/24/2026",
      customer: "AZIZ DAHIR",
      customerEmail: "ABDIAZIZ4C@GMAIL.COM",
      notes: "Haloo",
      lines: [
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
      ],
    },
  },
};
