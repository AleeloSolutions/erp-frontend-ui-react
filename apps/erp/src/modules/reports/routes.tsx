import { Navigate, Route, Routes } from "react-router-dom";
import BalanceSheetPage from "./pages/BalanceSheetPage";
import ProfitAndLossPage from "./pages/ProfitAndLossPage";
import CashFlowStatementPage from "./pages/CashFlowStatementPage";

/** Statement report routes — mounted at `/reports/*`. */
export function ReportsRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="balance-sheet" replace />} />
      <Route path="balance-sheet" element={<BalanceSheetPage />} />
      <Route path="profit-and-loss" element={<ProfitAndLossPage />} />
      <Route path="cash-flow" element={<CashFlowStatementPage />} />
    </Routes>
  );
}
