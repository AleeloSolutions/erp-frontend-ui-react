import type { Meta, StoryObj } from "@storybook/react";
import { AccountReport } from "./AccountReport";
import { balanceSheetNodes, cashFlowNodes, profitAndLossNodes } from "./fixtures";

const balanceColumn = [{ key: "balance", label: "Balance" }];

const meta = {
  title: "Components/AccountReport",
  component: AccountReport,
  parameters: {
    layout: "padded",
  },
  args: {
    columns: balanceColumn,
    nodes: balanceSheetNodes,
    spacerBetweenSections: true,
    spacerAfterSubGroups: false,
  },
} satisfies Meta<typeof AccountReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BalanceSheet: Story = {
  name: "Balance Sheet (Odoo)",
  decorators: [
    (Story) => (
      <div className="w-fit rounded-sm border border-erp-report-row-border bg-white p-1">
        <Story />
      </div>
    ),
  ],
};

export const ReceivablesExpanded: Story = {
  name: "Balance Sheet — Receivables expanded",
  args: {
    defaultExpandedIds: new Set(["receivables"]),
    onRowAction: (rowId) => {
      console.info("[AccountReport] row-action", { rowId });
    },
  },
  decorators: BalanceSheet.decorators,
};

export const Compact: Story = {
  name: "Balance Sheet — compact rows",
  args: {
    density: "compact",
  },
  decorators: BalanceSheet.decorators,
};

export const WithDrillDown: Story = {
  name: "Balance Sheet — clickable amounts",
  args: {
    onAmountClick: (rowId, columnKey) => {
      console.info("[AccountReport] amount-click", { rowId, columnKey });
    },
    onLabelClick: (rowId) => {
      console.info("[AccountReport] label-click", { rowId });
    },
  },
  decorators: BalanceSheet.decorators,
};

export const FlatRows: Story = {
  name: "Minimal two-line report",
  args: {
    spacerBetweenSections: false,
    nodes: [
      {
        id: "section",
        label: "Revenue",
        level: 0,
        amounts: { balance: 50_000 },
      },
      {
        id: "total",
        label: "Total Revenue",
        level: 1,
        total: true,
        amounts: { balance: 50_000 },
      },
    ],
  },
};

export const WithTitle: Story = {
  name: "Statement title in header",
  args: {
    title: "BALANCE SHEET",
  },
  decorators: BalanceSheet.decorators,
};

export const ExplicitSpacers: Story = {
  name: "Subtotal bars with spacerBefore",
  args: {
    title: "PROFIT AND LOSS",
    spacerBetweenSections: false,
    nodes: [
      { id: "revenue", label: "Revenue", level: 0, amounts: { balance: 120_810 } },
      { id: "costs", label: "Costs of Revenue", level: 0, amounts: { balance: 0 } },
      {
        id: "gross-profit",
        label: "Gross Profit",
        level: 0,
        sectionHeader: true,
        spacerBefore: true,
        amounts: { balance: 120_810 },
      },
      { id: "opex", label: "Operating Expenses", level: 0, amounts: { balance: 0 } },
      {
        id: "net-profit",
        label: "Net Profit",
        level: 0,
        sectionHeader: true,
        spacerBefore: true,
        amounts: { balance: 120_810 },
      },
    ],
  },
  decorators: BalanceSheet.decorators,
};

export const ProfitAndLoss: Story = {
  name: "Profit and Loss",
  args: {
    title: "PROFIT AND LOSS",
    nodes: profitAndLossNodes,
    spacerBetweenSections: false,
  },
  decorators: BalanceSheet.decorators,
};

export const CashFlow: Story = {
  name: "Cash Flow Statement",
  args: {
    title: "Cash Flow Statement",
    nodes: cashFlowNodes,
    spacerBetweenSections: false,
  },
  decorators: BalanceSheet.decorators,
};
