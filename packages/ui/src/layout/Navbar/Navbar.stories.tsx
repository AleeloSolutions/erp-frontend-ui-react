import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";

const meta = {
  title: "Layout/Navbar",
  component: Navbar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    brandLabel: "Sales",
    userName: "Owner",
    userFullName: "Hodan Ali",
    userDatabase: "hodan-store",
    userOnline: true,
  },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSubmenu: Story = {
  args: {
    submenuItems: [
      { key: "customers", label: "Customers", href: "#" },
      { key: "quotations", label: "Quotations", href: "#" },
      { key: "invoices", label: "Invoices", href: "#" },
    ],
    submenuActiveKey: "customers",
  },
};

/**
 * With `userMenuItems`, name + avatar open the account menu. The trigger
 * keeps the plain navbar look (no icon-button chrome / chevron).
 */
export const WithUserMenu: Story = {
  args: {
    userMenuItems: [{ key: "logout", label: "Log out", danger: true, onClick: () => {} }],
  },
};
