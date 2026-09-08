import type { Meta, StoryObj } from "@storybook/react";
import { DocumentCustomizer } from "./DocumentCustomizer";
import { sampleInvoice } from "./fixtures/sampleInvoice";
import { defaultDocumentSettings } from "./config/defaultSettings";

const meta = {
  title: "Pages/Invoice Layout System",
  component: DocumentCustomizer,
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
} satisfies Meta<typeof DocumentCustomizer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Customizer: Story = {
  args: {
    data: sampleInvoice,
    defaultSettings: defaultDocumentSettings,
  },
};
