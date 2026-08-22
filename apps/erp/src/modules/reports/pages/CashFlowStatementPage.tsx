import { StatementReportPage } from "../components";
import { cashFlowNodes } from "../data";

export default function CashFlowStatementPage() {
  return (
    <StatementReportPage
      navKey="cash-flow"
      section="Cash Flow Statement"
      description="Cash movement across operating, investing and financing activities."
      reportTitle="Cash Flow Statement"
      nodes={cashFlowNodes}
    />
  );
}
