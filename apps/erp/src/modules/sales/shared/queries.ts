/**
 * Hooks over the tenant configuration every sales document reads.
 */

import { useQuery } from "@tanstack/react-query";
import { listPaymentMethods, listTaxes } from "./api";

/** The tenant's tax rates; the invoice editor's tax dropdown. */
export function useTaxesQuery() {
  return useQuery({ queryKey: ["sales", "taxes"], queryFn: listTaxes });
}

/** Cash, bank, mobile money; the payment dialog's method dropdown. */
export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: ["sales", "payment-methods"],
    queryFn: listPaymentMethods,
  });
}
