import { Route } from "react-router-dom";
import TicketsPage from "./pages/list";
import TicketFormPage from "./pages/create";

/** Ticket routes — nested under `/pos` by the module routes. */
export const ticketRoutes = (
  <>
    <Route path="tickets" element={<TicketsPage />} />
    <Route path="tickets/new" element={<TicketFormPage />} />
  </>
);
