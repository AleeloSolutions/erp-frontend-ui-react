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
    defaultModule: "general",
    defaultTab: "users",
  },
};

export const CompanyInfo: Story = {
  args: {
    defaultModule: "general",
    defaultTab: "company",
  },
};

export const Modules: Story = {
  args: {
    defaultModule: "general",
    defaultTab: "modules",
  },
};

export const DocumentLayout: Story = {
  args: {
    defaultModule: "general",
    defaultTab: "document-layout",
  },
};

export const Language: Story = {
  args: {
    defaultModule: "general",
    defaultTab: "language",
  },
};

export const DocumentLayoutConfigure: Story = {
  args: {
    defaultModule: "general",
    defaultTab: "document-layout",
    defaultDocumentLayoutOpen: true,
  },
};

export const CompanyEdit: Story = {
  args: {
    defaultModule: "general",
    defaultTab: "company",
    defaultDetailView: "company-edit",
  },
};

export const UsersManage: Story = {
  args: {
    defaultModule: "general",
    defaultTab: "users",
    defaultDetailView: "users-manage",
  },
};

export const Sales: Story = {
  args: {
    defaultModule: "sales",
    defaultTab: "sales",
  },
};
