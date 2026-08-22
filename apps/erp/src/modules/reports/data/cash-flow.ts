import type { AccountReportNode } from "@erp/ui";

const cashInOut = (prefix: string): AccountReportNode[] => [
  { id: `${prefix}-cash-in`, label: "Cash in", level: 5, amounts: { balance: 0 } },
  { id: `${prefix}-cash-out`, label: "Cash out", level: 5, amounts: { balance: 0 } },
];

/** Odoo-style cash flow statement. Demo figures until the accounting API is wired up. */
export const cashFlowNodes: AccountReportNode[] = [
  {
    id: "cash-beginning",
    label: "Cash and cash equivalents, beginning of period",
    level: 0,
    sectionHeader: true,
    amounts: { balance: 0 },
  },
  {
    id: "net-increase",
    label: "Net increase in cash and cash equivalents",
    level: 0,
    sectionHeader: true,
    spacerBefore: true,
    children: [
      {
        id: "operating-activities",
        label: "Cash flows from operating activities",
        level: 3,
        children: [
          {
            id: "advance-received",
            label: "Advance Payments received from customers",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "cash-received-operating",
            label: "Cash received from operating activities",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "advance-paid",
            label: "Advance payments made to suppliers",
            level: 5,
            amounts: { balance: 0 },
          },
          {
            id: "cash-paid-operating",
            label: "Cash paid for operating activities",
            level: 5,
            amounts: { balance: 0 },
          },
        ],
      },
      {
        id: "investing-activities",
        label: "Cash flows from investing & extraordinary activities",
        level: 3,
        children: cashInOut("investing"),
      },
      {
        id: "financing-activities",
        label: "Cash flows from financing activities",
        level: 3,
        children: cashInOut("financing"),
      },
      {
        id: "unclassified-activities",
        label: "Cash flows from unclassified activities",
        level: 3,
        children: cashInOut("unclassified"),
      },
    ],
  },
  {
    id: "cash-closing",
    label: "Cash and cash equivalents, closing balance",
    level: 0,
    sectionHeader: true,
    spacerBefore: true,
    amounts: { balance: 0 },
  },
];
