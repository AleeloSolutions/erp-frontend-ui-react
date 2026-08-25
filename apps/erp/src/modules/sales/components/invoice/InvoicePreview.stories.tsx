import type { Meta, StoryObj } from "@storybook/react";
import { InvoicePreview } from "./InvoicePreview";
import { mockInvoiceData } from "./mock/mockInvoiceData";
import { mockInvoiceDataClassic } from "./mock/mockInvoiceDataClassic";
import { defaultInvoiceSettings } from "./config/defaultSettings";

/**
 * Verifies the refactored registry-driven Dual+Light combo renders
 * pixel-identical to the pre-refactor `InvoicePrintDocumentDualHeader`
 * story (same mock data: INV/2026/00010, ABDIFATAH MOAHMED, 10 lines).
 * Compare this against "Pages/Invoice → Print Dual Header" side by side.
 */
const meta = {
  title: "Pages/Invoice Layout System",
  component: InvoicePreview,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <>
        {/* Storybook's global preview decorator wraps every story in a
         * `p-4` div that isn't print-aware, which pushes this A4-height
         * document past one physical page. Neutralize it during print. */}
        <style>
          {
            "@media print { #storybook-root > div { padding: 0 !important; min-height: 0 !important; } }"
          }
        </style>
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof InvoicePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DualLight: Story = {
  args: {
    data: mockInvoiceData,
    settings: defaultInvoiceSettings,
  },
};

/**
 * Verifies the refactored registry-driven Center+Striped combo renders
 * pixel-identical to the pre-refactor `InvoicePrintDocumentClassic` story
 * (same mock data: INV/2026/00008, AZIZ DAHIR, 10 lines). Compare against
 * "Pages/Invoice → Print Classic" side by side.
 */
export const CenterStriped: Story = {
  args: {
    data: mockInvoiceDataClassic,
    settings: {
      ...defaultInvoiceSettings,
      layout: "center",
      tableStyle: "striped",
    },
  },
};

/**
 * Verifies the refactored registry-driven Bubble+Bordered combo renders
 * pixel-identical to the pre-refactor `InvoicePrintDocumentBackground`
 * story (same mock data as Dual: INV/2026/00010, ABDIFATAH MOAHMED, 10
 * lines — Background and Dual always shared this reference invoice).
 * Compare against "Pages/Invoice → Print Background" side by side.
 */
export const BubbleBordered: Story = {
  args: {
    data: mockInvoiceData,
    settings: {
      ...defaultInvoiceSettings,
      layout: "bubble",
      tableStyle: "bordered",
    },
  },
};
