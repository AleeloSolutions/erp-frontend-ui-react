/**
 * The three statements the design system demonstrates -- a balance sheet,
 * a profit and loss, and a cash flow -- as `AccountReportNode` trees.
 *
 * Reached through the `@erp/ui/fixtures` subpath, never the package
 * barrel: sample data has no business in an application bundle unless a
 * screen asks for it by name.
 */
export { balanceSheetNodes } from "./balance-sheet";
export { profitAndLossNodes } from "./profit-and-loss";
export { cashFlowNodes } from "./cash-flow";
