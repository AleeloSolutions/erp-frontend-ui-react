import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { Home, ShoppingCart, Users, FileText, Settings } from "lucide-react";
import type { MobileNavItem, NavigationItem, SubmenuItem } from "../types/navigation";

export function RouterDecorator({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={["/sales/customers"]}>{children}</MemoryRouter>;
}

export const demoNavigation: NavigationItem[] = [
  { key: "home", label: "Home", href: "/", icon: Home },
  {
    key: "sales",
    label: "Sales",
    href: "/sales",
    icon: ShoppingCart,
    children: [
      { key: "customers", label: "Customers", href: "/sales/customers" },
      { key: "quotations", label: "Quotations", href: "/sales/quotations" },
    ],
  },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export const demoMobileNav: MobileNavItem[] = [
  { key: "home", label: "Home", href: "/", icon: Home },
  { key: "sales", label: "Sales", href: "/sales/customers", icon: Users },
  { key: "docs", label: "Docs", href: "/docs", icon: FileText },
];

export const demoSubmenu: SubmenuItem[] = [
  { key: "customers", label: "Customers", href: "/sales/customers" },
  { key: "quotations", label: "Quotations", href: "/sales/quotations" },
  { key: "contracts", label: "Contracts", href: "/sales/contracts" },
];
