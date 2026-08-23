import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "@/app/AppProviders";
import InvoiceCreatePage from "./InvoiceCreatePage";

/**
 * The real "New Invoice" route (`/sales/invoices/new`), rendered with the
 * app's actual providers (i18n, React Query, toasts) and a MemoryRouter so
 * `useNavigate` works — everything here behaves exactly as it does in the
 * app: product/account search, section/note rows, tab switching, and form
 * submission (backed by the in-memory mock API, no network calls).
 */
const meta = {
  title: "Pages/Invoice",
  component: InvoiceCreatePage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/sales/invoices/new"]}>
        <AppProviders>
          <Story />
        </AppProviders>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof InvoiceCreatePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Invoice: Story = {};
