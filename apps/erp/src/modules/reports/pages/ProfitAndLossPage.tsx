import { StatementReportPage } from "../components";
import { profitAndLossNodes } from "../data";

export default function ProfitAndLossPage() {
  return (
    <StatementReportPage
      navKey="profit-and-loss"
      section="Profit and Loss"
      description="Revenue, costs and resulting profit over the period."
      reportTitle="PROFIT AND LOSS"
      nodes={profitAndLossNodes}
    />
  );
}
