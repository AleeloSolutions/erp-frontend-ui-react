import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Home,
  ListTodo,
  PlusCircle,
  MoreHorizontal,
} from "lucide-react";
import type { MobileNavItem, NavigationItem } from "@erp/ui";

export const navigation: NavigationItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/components-demo",
    children: [
      { key: "tasks", label: "Tasks", href: "/components-demo" },
      { key: "announcements", label: "Announcements", href: "/components-demo" },
      { key: "shortcuts", label: "Shortcuts", href: "/components-demo" },
    ],
  },
  // {
  //   key: "finance",
  //   label: "Finance",
  //   icon: Wallet,
  //   href: "/components-demo",
  //   children: [
  //     { key: "invoices", label: "Customer invoices", href: "/components-demo" },
  //     { key: "payments", label: "Customer payments", href: "/components-demo" },
  //     { key: "statements", label: "Customer statements", href: "/components-demo" },
  //     { key: "creditnotes", label: "Credit notes", href: "/components-demo" },
  //     { key: "accounts", label: "Chart of accounts", href: "/components-demo" },
  //   ],
  // },
  {
    key: "sales",
    label: "Sales",
    icon: ShoppingCart,
    href: "/sales/customers",
    children: [
      { key: "customers", label: "Customers", href: "/sales/customers" },
      { key: "quotations", label: "Quotations", href: "/sales/quotations" },
      { key: "contracts", label: "Contracts", href: "/sales/contracts" },
      { key: "orders", label: "Sales orders", href: "/sales/orders" },
    ],
  },
  // {
  //   key: "procurement",
  //   label: "Procurement",
  //   icon: ArrowLeftRight,
  //   href: "/components-demo",
  //   children: [
  //     { key: "suppliers", label: "Suppliers", href: "/components-demo" },
  //     { key: "orders", label: "Purchase orders", href: "/components-demo" },
  //   ],
  // },
  // {
  //   key: "inventory",
  //   label: "Inventory",
  //   icon: Package,
  //   href: "/components-demo",
  //   children: [
  //     { key: "products", label: "Products", href: "/components-demo" },
  //     { key: "movements", label: "Stock movements", href: "/components-demo" },
  //   ],
  // },
  // {
  //   key: "hr",
  //   label: "Human resources",
  //   icon: Users,
  //   href: "/components-demo",
  //   children: [
  //     { key: "employees", label: "Employees", href: "/components-demo" },
  //     { key: "leave", label: "Leave requests", href: "/components-demo" },
  //   ],
  // },
  // {
  //   key: "projects",
  //   label: "Projects",
  //   icon: FolderKanban,
  //   href: "/components-demo",
  //   children: [
  //     { key: "projects", label: "Projects", href: "/components-demo" },
  //     { key: "tasks", label: "Tasks", href: "/components-demo" },
  //   ],
  // },
  // {
  //   key: "approvals",
  //   label: "Approvals",
  //   icon: CheckCircle2,
  //   href: "/components-demo",
  // },
  // {
  //   key: "reports",
  //   label: "Reports",
  //   icon: BarChart3,
  //   href: "/components-demo",
  // },
  // {
  //   key: "documents",
  //   label: "Documents",
  //   icon: FileText,
  //   href: "/components-demo",
  // },
  // {
  //   key: "favorites",
  //   label: "Favorites",
  //   icon: Star,
  //   href: "/components-demo",
  // },
  // {
  //   key: "recent",
  //   label: "Recent",
  //   icon: Clock3,
  //   href: "/components-demo",
  // },
  // {
  //   key: "administration",
  //   label: "Administration",
  //   icon: Settings,
  //   href: "/components-demo",
  // },
  // {
  //   key: "help",
  //   label: "Help",
  //   icon: CircleHelp,
  //   href: "/components-demo",
  // },
];

export const financeSubmenu = [
  { key: "invoices", label: "Customer invoices", href: "/components-demo" },
  { key: "payments", label: "Customer payments", href: "/components-demo" },
  { key: "statements", label: "Customer statements", href: "/components-demo" },
  { key: "creditnotes", label: "Credit notes", href: "/components-demo" },
  { key: "accounts", label: "Chart of accounts", href: "/components-demo" },
];

export const salesSubmenu = [
  { key: "customers", label: "Customers", href: "/sales/customers" },
  { key: "quotations", label: "Quotations", href: "/sales/quotations" },
  { key: "contracts", label: "Contracts", href: "/sales/contracts" },
  { key: "orders", label: "Sales orders", href: "/components-demo" },
];

export const mobileNavigation: MobileNavItem[] = [
  { key: "home", label: "Home", href: "/", icon: Home },
  { key: "tasks", label: "Tasks", href: "/components-demo", icon: ListTodo },
  { key: "create", label: "Create", href: "/components-demo", icon: PlusCircle },
  { key: "reports", label: "Reports", href: "/components-demo", icon: BarChart3 },
  { key: "more", label: "More", href: "/components-demo", icon: MoreHorizontal },
];
