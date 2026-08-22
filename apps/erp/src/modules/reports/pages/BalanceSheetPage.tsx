import { StatementReportPage } from "../components";
import { balanceSheetNodes } from "../data";

export default function BalanceSheetPage() {
  return (
    <StatementReportPage
      navKey="balance-sheet"
      section="Balance Sheet"
      description="Assets, liabilities and equity at a point in time."
      reportTitle="BALANCE SHEET"
      nodes={balanceSheetNodes}
      spacerBetweenSections
    />
  );
}
