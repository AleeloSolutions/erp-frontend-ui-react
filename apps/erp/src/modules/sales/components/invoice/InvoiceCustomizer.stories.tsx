import type { Meta, StoryObj } from "@storybook/react";
import { InvoiceCustomizer } from "./InvoiceCustomizer";
import { mockInvoiceData } from "./mock/mockInvoiceData";
import { defaultInvoiceSettings } from "./config/defaultSettings";

const meta = {
  title: "Pages/Invoice Layout System",
  component: InvoiceCustomizer,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <>
        {/* Storybook's global preview decorator wraps every story in a
         * `p-4` div that isn't print-aware, which pushes the A4-height
         * preview past one physical page. Neutralize it during print. */}
        <style>
          {
            "@media print { #storybook-root > div { padding: 0 !important; min-height: 0 !important; } }"
          }
        </style>
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof InvoiceCustomizer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Customizer: Story = {
  args: {
    data: mockInvoiceData,
    defaultSettings: defaultInvoiceSettings,
  },
};
