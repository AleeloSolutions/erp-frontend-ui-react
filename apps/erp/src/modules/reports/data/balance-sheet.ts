import type { AccountReportNode } from "@erp/ui";

/** Odoo-style balance sheet. Demo figures until the accounting API is wired up. */
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
          { id: "prepayments", label: "Prepayments", level: 5, amounts: { balance: 0 } },
          {
            id: "total-current-assets",
            label: "Total Current Assets",
            level: 3,
            total: true,
            amounts: { balance: 120_810 },
          },
        ],
      },
      { id: "fixed-assets", label: "Fixed Assets", level: 3, amounts: { balance: 0 } },
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
          { id: "credit-card", label: "Credit Card", level: 5, amounts: { balance: 0 } },
          { id: "payables", label: "Payables", level: 5, amounts: { balance: 0 } },
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
      { id: "equity-capital", label: "Equity", level: 3, amounts: { balance: 0 } },
      {
        id: "earnings",
        label: "Earnings",
        level: 3,
        children: [
          {
            id: "current-year-earnings",
            label: "Current Year Unallocated Earnings",
            level: 5,
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
