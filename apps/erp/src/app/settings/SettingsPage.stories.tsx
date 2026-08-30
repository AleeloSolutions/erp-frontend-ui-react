import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@erp/ui";
import SettingsPage from "./SettingsPage";

const meta = {
  title: "Pages/Settings",
  component: SettingsPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings"]}>
          <div className="!m-0 !min-h-0 !bg-transparent !p-0">
            <Routes>
              <Route path="/settings" element={<Story />} />
            </Routes>
          </div>
        </MemoryRouter>
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Users: Story = {
  args: {
    defaultTab: "users",
  },
};

export const CompanyInfo: Story = {
  args: {
    defaultTab: "company",
  },
};

export const DocumentLayout: Story = {
  args: {
    defaultTab: "document-layout",
  },
};

export const DocumentLayoutConfigure: Story = {
  args: {
    defaultTab: "document-layout",
    defaultDocumentLayoutOpen: true,
  },
};

export const CompanyEdit: Story = {
  args: {
    defaultTab: "company",
    defaultDetailView: "company-edit",
  },
};

export const UsersManage: Story = {
  args: {
    defaultTab: "users",
    defaultDetailView: "users-manage",
  },
};
