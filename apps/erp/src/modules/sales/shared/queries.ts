/**
 * Hooks over the tenant configuration every sales document reads.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPaymentMethod,
  createTax,
  getSalesSettings,
  listPaymentMethods,
  listTaxes,
  updatePaymentMethod,
  updateSalesSettings,
  updateTax,
  type PaymentMethodInput,
  type SalesSettingsInput,
  type SalesTaxInput,
} from "./api";

export const salesConfigKeys = {
  taxes: ["sales", "taxes"] as const,
  paymentMethods: ["sales", "payment-methods"] as const,
  settings: ["sales", "settings"] as const,
};

/** The tenant's tax rates; the invoice editor's tax dropdown. */
export function useTaxesQuery() {
  return useQuery({ queryKey: salesConfigKeys.taxes, queryFn: listTaxes });
}

/** Cash, bank, mobile money; the payment dialog's method dropdown. */
export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: salesConfigKeys.paymentMethods,
    queryFn: listPaymentMethods,
  });
}

/** Invoicing defaults: prefix, due days, default tax, terms. */
export function useSalesSettingsQuery() {
  return useQuery({
    queryKey: salesConfigKeys.settings,
    queryFn: getSalesSettings,
  });
}

export function useUpdateSalesSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalesSettingsInput) => updateSalesSettings(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salesConfigKeys.settings });
    },
  });
}

export function useCreateTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalesTaxInput) => createTax(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salesConfigKeys.taxes });
      void queryClient.invalidateQueries({ queryKey: salesConfigKeys.settings });
    },
  });
}

export function useUpdateTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: Partial<SalesTaxInput> }) =>
      updateTax(uuid, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salesConfigKeys.taxes });
      void queryClient.invalidateQueries({ queryKey: salesConfigKeys.settings });
    },
  });
}

export function useCreatePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentMethodInput) => createPaymentMethod(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: salesConfigKeys.paymentMethods,
      });
    },
  });
}

export function useUpdatePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: Partial<PaymentMethodInput> }) =>
      updatePaymentMethod(uuid, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: salesConfigKeys.paymentMethods,
      });
    },
  });
}
