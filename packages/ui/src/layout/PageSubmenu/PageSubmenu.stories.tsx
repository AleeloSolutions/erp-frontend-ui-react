import type { Meta, StoryObj } from "@storybook/react";
import {
  Banknote,
  Calculator,
  Package,
  Scan,
  Settings2,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { PageSubmenu } from "./PageSubmenu";
import type { SubmenuItem } from "../../types/navigation";
import { RouterDecorator, demoSubmenu } from "../../storybook/demo-nav";

const meta = {
  title: "Layout/PageSubmenu",
  component: PageSubmenu,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <div className="overflow-hidden rounded-lg border border-erp-border bg-white">
          <Story />
        </div>
      </RouterDecorator>
    ),
  ],
  args: {
    module: "Sales",
    items: demoSubmenu,
    activeKey: "customers",
  },
} satisfies Meta<typeof PageSubmenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutModule: Story = {
  args: {
    module: undefined,
  },
};

const iconItems: SubmenuItem[] = [
  { key: "customers", label: "Customers", href: "/sales/customers", icon: Users },
  { key: "products", label: "Products", href: "/sales/products", icon: Package },
  { key: "sale-list", label: "Sales", href: "/sales/sales", icon: ShoppingCart },
];

export const WithIcons: Story = {
  args: { items: iconItems },
};

/**
 * A rendered node in the icon slot instead of a LucideIcon — the shape a
 * module logo arrives in. The slot sizes either the same way.
 */
export const WithLogoImage: Story = {
  args: {
    items: [
      {
        key: "customers",
        label: "Customers",
        href: "/sales/customers",
        icon: (
          <span className="grid h-full w-full place-items-center rounded-[3px] bg-erp-primary text-[8px] font-bold text-white">
            EA
          </span>
        ),
      },
      ...iconItems.slice(1),
    ],
  },
};

const settingsItems: SubmenuItem[] = [
  { key: "general", label: "General", href: "/settings", icon: Settings2 },
  { key: "sales", label: "Sales", href: "/settings", icon: ShoppingCart },
  { key: "sample:accounting", label: "Accounting", href: "/settings", icon: Calculator },
  { key: "sample:purchasing", label: "Purchasing", href: "/settings", icon: Truck },
  { key: "sample:inventory", label: "Inventory", href: "/settings", icon: Package },
  { key: "sample:hr", label: "HR", href: "/settings", icon: Users },
  { key: "sample:payroll", label: "Payroll", href: "/settings", icon: Banknote },
  { key: "sample:pos", label: "Point of Sale", href: "/settings", icon: Scan },
];

/**
 * The Settings bar: no filled pill, a hairline under the open item, and
 * type a step down, so it reads as secondary to the page it frames.
 */
export const QuietTone: Story = {
  args: {
    module: undefined,
    tone: "quiet",
    items: settingsItems,
    activeKey: "general",
  },
};

/** Side by side — the whole point of the tone is the difference. */
export const ToneComparison: Story = {
  args: { items: settingsItems, activeKey: "sales" },
  render: (args) => (
    <div className="divide-y divide-erp-border-soft">
      <div className="px-2 py-1.5">
        <PageSubmenu {...args} tone="default" />
      </div>
      <div className="px-2 py-1.5">
        <PageSubmenu {...args} tone="quiet" />
      </div>
    </div>
  ),
};

/** Eight entries in a narrow bar — the overflow scroll doing its job. */
export const QuietToneOverflowing: Story = {
  args: { tone: "quiet", items: settingsItems, activeKey: "sample:payroll" },
  decorators: [
    (Story) => (
      <RouterDecorator>
        <div className="w-[26rem] overflow-hidden rounded-lg border border-erp-border bg-white">
          <Story />
        </div>
      </RouterDecorator>
    ),
  ],
};
