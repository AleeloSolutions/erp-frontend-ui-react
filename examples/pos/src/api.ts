/**
 * The POS module's data layer, over `/api/v1/pos/tickets/` -- the routes
 * its backend half (kaabe-backend/examples/pos) mounts. Goes through the
 * host's API client, so the envelope, the JWT refresh and the tenant
 * header are handled exactly as for a compiled-in module.
 */

import { api } from "@kaabe/runtime";

export type TicketStatus = "open" | "paid" | "void";

export interface Ticket {
  uuid: string;
  title: string;
  status: TicketStatus;
  /** A money amount, as the API's decimal string. */
  total_amount: string;
  notes: string;
  branch: { uuid: string; name: string; code: string };
  created_at: string;
  updated_at: string;
}

export interface TicketInput {
  title: string;
  total_amount: string;
  notes?: string;
}

export const TICKETS_QUERY_KEY = ["pos", "tickets"] as const;

export async function listTickets(): Promise<Ticket[]> {
  const page = await api.apiGetPage<Ticket>(
    "/v1/pos/tickets/?page_size=100&ordering=-created_at"
  );
  return page.data;
}

export function createTicket(input: TicketInput) {
  return api.apiPost<Ticket>("/v1/pos/tickets/", input);
}

export function payTicket(uuid: string) {
  return api.apiPost<Ticket>(`/v1/pos/tickets/${uuid}/pay/`);
}

export function voidTicket(uuid: string) {
  return api.apiPost<Ticket>(`/v1/pos/tickets/${uuid}/void/`);
}
