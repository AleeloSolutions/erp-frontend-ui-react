import type { Meta, StoryObj } from "@storybook/react";
import { Badge, Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@erp/ui";
import {
  DEFAULT_MODULE_ICON_NAME,
  MODULE_ICONS,
  MODULE_ICON_NAMES,
  resolveModuleIcon,
} from "./moduleIcons";

/**
 * The marks a module may wear.
 *
 * A module names its icon as a string and the backend validates that
 * string against this same list. Both stories below are here so the two
 * halves of that contract can be reviewed by eye: what the 31 names
 * actually look like, and what happens to a card whose name this build
 * cannot place.
 */
const meta: Meta = {
  title: "ERP/Module Icons",
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Every name on the allowlist, in contract order. */
export const Allowlist: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3">
      {MODULE_ICON_NAMES.map((name) => {
        const Icon = MODULE_ICONS[name];
        const isDefault = name === DEFAULT_MODULE_ICON_NAME;
        return (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-sm border border-erp-border-soft bg-white px-2 py-3 text-center"
          >
            <Icon className="h-5 w-5 text-erp-text" aria-hidden />
            <span className="text-[11px] leading-tight break-all text-erp-muted">
              {name}
            </span>
            {isDefault ? <Badge variant="success">default</Badge> : null}
          </div>
        );
      })}
    </div>
  ),
};

/**
 * What the Modules screen looks like once modules carry their own mark.
 *
 * The last two cards are the contract's unhappy paths, drawn next to the
 * happy ones on purpose: a module that names nothing, and a module that
 * names a real Lucide icon that is not on the allowlist (the shape of
 * drift between a newer backend and this build). Both come out wearing
 * Blocks, and neither breaks the grid.
 */
const SAMPLE = [
  { key: "sales", label: "Sales", icon: "ShoppingCart", status: "Installed" },
  { key: "inv", label: "Inventory", icon: "Warehouse", status: "Installed" },
  { key: "acc", label: "Accounting", icon: "Landmark", status: "Installed" },
  { key: "pur", label: "Purchasing", icon: "Truck", status: "Installed" },
  { key: "hr", label: "People", icon: "Users", status: "Installed" },
  { key: "pay", label: "Payroll", icon: "Banknote", status: "Disabled" },
  { key: "pos", label: "Point of Sale", icon: "Scan", status: "Installed" },
  { key: "mfg", label: "Manufacturing", icon: "Factory", status: "Disabled" },
  { key: "plain", label: "Names no icon", icon: "", status: "Installed" },
  { key: "drift", label: "Names an icon we lack", icon: "Sparkles", status: "Installed" },
];

const CARD_STATUS: Record<string, string> = {
  Installed: "active",
  Disabled: "inactive",
};

export const OnModuleCards: Story = {
  render: () => (
    <div className="grid gap-4 min-[721px]:grid-cols-2 min-[1100px]:grid-cols-3">
      {SAMPLE.map((module) => {
        const Icon = resolveModuleIcon(module.icon);
        return (
          <Card key={module.key}>
            <CardHeader>
              <Icon className="h-4 w-4 shrink-0 text-erp-muted" aria-hidden />
              <CardTitle className="min-w-0 flex-1 truncate">{module.label}</CardTitle>
              <StatusBadge status={CARD_STATUS[module.status]} label={module.status} />
            </CardHeader>
            <CardContent className="space-y-2 text-[12px] text-erp-muted">
              <div>Version 1.0.0</div>
              <div>
                icon: <code>{module.icon === "" ? '""' : module.icon}</code>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  ),
};
