/** Tickets: the slice's public surface. Pages stay private to `routes`. */
export { ticketRoutes } from "./routes";
export type { Ticket, TicketInput, TicketStatus } from "./api";
export {
  TICKETS_QUERY_KEY,
  listTickets,
  createTicket,
  payTicket,
  voidTicket,
} from "./api";
