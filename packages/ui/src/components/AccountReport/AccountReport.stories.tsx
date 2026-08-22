import type { Meta, StoryObj } from "@storybook/react";
import type { AccountReportNode } from "../../types/report";
import { AccountReport } from "./AccountReport";

const balanceColumn = [{ key: "balance", label: "Balance" }];

/** Sample tree matching the Odoo balance sheet HTML the user provided. */
export const balanceSheetNodes: AccountReportNode[] = [
  {
    id: "assets",
    label: "ASSETS",
    level: 0,
    children: [
      {
        id: "current-assets",
        label: "Current Assets",
        level: 3,
        children: [
          {
            id: "bank-cash",
            label: "Bank and Cash Accounts",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "receivables",
            label: "Receivables",
            level: 5,
            unfoldable: true,
            amounts: { balance: 120_810 },
            children: [
              {
                id: "account-receivable",
                label: "121000 Accounts Receivable",
                level: 5,
                detail: true,
                showActions: true,
                amounts: { balance: 120_810 },
              },
              {
                id: "total-receivables",
                label: "Total Receivables",
                level: 5,
                total: true,
                amounts: { balance: 120_810 },
              },
            ],
          },
          {
            id: "current-assets-other",
            label: "Current Assets",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "prepayments",
            label: "Prepayments",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "total-current-assets",
            label: "Total Current Assets",
            level: 3,
            total: true,
            amounts: { balance: 120_810 },
          },
        ],
      },
      {
        id: "fixed-assets",
        label: "Fixed Assets",
        level: 3,
        amounts: { balance: 0 },
      },
      {
        id: "non-current-assets",
        label: "Non-current Assets",
        level: 3,
        amounts: { balance: 0 },
      },
      {
        id: "total-assets",
        label: "Total ASSETS",
        level: 1,
        total: true,
        amounts: { balance: 120_810 },
      },
    ],
  },
  {
    id: "liabilities",
    label: "LIABILITIES",
    level: 0,
    children: [
      {
        id: "current-liabilities-group",
        label: "Current Liabilities",
        level: 3,
        children: [
          {
            id: "current-liabilities",
            label: "Current Liabilities",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "credit-card",
            label: "Credit Card",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "payables",
            label: "Payables",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "total-current-liabilities",
            label: "Total Current Liabilities",
            level: 3,
            total: true,
            amounts: { balance: 0 },
          },
        ],
      },
      {
        id: "non-current-liabilities",
        label: "Non-current Liabilities",
        level: 3,
        amounts: { balance: 0 },
      },
      {
        id: "total-liabilities",
        label: "Total LIABILITIES",
        level: 1,
        total: true,
        amounts: { balance: 0 },
      },
    ],
  },
  {
    id: "equity",
    label: "EQUITY (& EARNINGS)",
    level: 0,
    children: [
      {
        id: "equity-capital",
        label: "Equity",
        level: 3,
        amounts: { balance: 0 },
      },
      {
        id: "earnings",
        label: "Earnings",
        level: 3,
        children: [
          {
            id: "current-year-earnings",
            label: "Current Year Unallocated Earnings",
            level: 5,
            labelLink: true,
            amounts: { balance: 120_810 },
          },
          {
            id: "previous-years-earnings",
            label: "Previous Years Earnings",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "total-earnings",
            label: "Total Earnings",
            level: 3,
            total: true,
            amounts: { balance: 120_810 },
          },
        ],
      },
      {
        id: "total-equity",
        label: "Total EQUITY (& EARNINGS)",
        level: 1,
        total: true,
        amounts: { balance: 120_810 },
      },
    ],
  },
  {
    id: "liabilities-equity",
    label: "LIABILITIES + EQUITY",
    level: 0,
    sectionHeader: true,
    amounts: { balance: 120_810 },
  },
];

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
