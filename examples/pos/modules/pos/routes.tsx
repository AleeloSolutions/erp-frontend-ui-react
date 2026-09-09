import { Navigate, Route, Routes } from "react-router-dom";
import { ticketRoutes } from "./tickets";

/** POS routes — the host mounts them at `/pos/*` once the module registers. */
export function PosRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="tickets" replace />} />
      {ticketRoutes}
    </Routes>
  );
}
