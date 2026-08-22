import type { AccountReportNode } from "@erp/ui";

/**
 * Odoo-style profit and loss. Subtotal bars are `sectionHeader` rows with an
 * explicit `spacerBefore`, so the gap lands only ahead of each subtotal.
 */
export const profitAndLossNodes: AccountReportNode[] = [
  {
    id: "revenue",
    label: "Revenue",
    level: 0,
    unfoldable: true,
    amounts: { balance: 120_810 },
    children: [
      {
        id: "product-sales",
        label: "400000 Product Sales",
        level: 5,
        detail: true,
        amounts: { balance: 120_810 },
      },
      {
        id: "total-revenue",
        label: "Total Revenue",
        level: 5,
        total: true,
        amounts: { balance: 120_810 },
      },
    ],
  },
  {
    id: "costs-of-revenue",
    label: "Costs of Revenue",
    level: 0,
    amounts: { balance: 0 },
  },
  {
    id: "gross-profit",
    label: "Gross Profit",
    level: 0,
    sectionHeader: true,
    spacerBefore: true,
    amounts: { balance: 120_810 },
  },
  {
    id: "operating-expenses",
    label: "Operating Expenses",
    level: 0,
    amounts: { balance: 0 },
  },
  {
    id: "operating-income",
    label: "Operating Income (or Loss)",
    level: 0,
    sectionHeader: true,
    spacerBefore: true,
    amounts: { balance: 120_810 },
  },
  { id: "other-income", label: "Other Income", level: 0, amounts: { balance: 0 } },
  { id: "other-expenses", label: "Other Expenses", level: 0, amounts: { balance: 0 } },
  {
    id: "net-profit",
    label: "Net Profit",
    level: 0,
    sectionHeader: true,
    spacerBefore: true,
    amounts: { balance: 120_810 },
  },
  {
    id: "allocations-withdrawals",
    label: "Allocations and Withdrawals",
    level: 0,
    amounts: { balance: 0 },
  },
  {
    id: "net-profit-left",
    label: "Net Profit Left After Allocations and Withdrawals",
    level: 0,
    sectionHeader: true,
    spacerBefore: true,
    amounts: { balance: 120_810 },
  },
];
