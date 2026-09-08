import { Navigate, Route, Routes } from "react-router-dom";
import TicketFormPage from "./pages/TicketFormPage";
import TicketsPage from "./pages/TicketsPage";

/** POS routes -- the host mounts them at `/pos/*` once the module registers. */
export function PosRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="tickets" replace />} />
      <Route path="tickets" element={<TicketsPage />} />
      <Route path="tickets/new" element={<TicketFormPage />} />
    </Routes>
  );
}
