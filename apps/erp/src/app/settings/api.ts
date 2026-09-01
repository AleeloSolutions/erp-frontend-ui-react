/**
 * Settings → Company Info against the Django backend.
 *
 * Company identity is split across two endpoints: the tenant row
 * (`/clients/me/` — the name) and its configuration (`/client-config/`
 * — address, tax id, contact details). This hook presents them as one
 * `CompanyInfo` and saves back to both.
 *
 * Deliberately plain state + effect (no React Query): Settings renders
 * inside Storybook stories where no QueryProvider exists; there the
 * fetch simply never runs and the demo defaults stay.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";
import { defaultCompanyInfo, type CompanyInfo } from "./settingsCompany";

interface ClientDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  trial_ends_at: string | null;
}

interface ClientConfigurationDto {
  address: string;
  tax_id: string;
  contact_email: string;
  contact_phone: string;
}

export function useCompanyInfo() {
  const [info, setInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    void Promise.all([
      apiGet<ClientDetail>("/v1/clients/me/"),
      apiGet<ClientConfigurationDto>("/v1/client-config/"),
    ])
      .then(([client, config]) => {
        if (cancelled) return;
        setInfo({
          name: client.name,
          address: config.address ?? "",
          taxId: config.tax_id ?? "",
          email: config.contact_email ?? "",
          phone: config.contact_phone ?? "",
        });
        setLoaded(true);
      })
      .catch(() => {
        // Not on a tenant subdomain (or offline): keep the demo defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (values: CompanyInfo) => {
    await Promise.all([
      apiPatch("/v1/clients/me/", { name: values.name }),
      apiPatch("/v1/client-config/", {
        address: values.address,
        tax_id: values.taxId,
        contact_email: values.email,
        contact_phone: values.phone,
      }),
    ]);
    setInfo(values);
  }, []);

  return { info, loaded, save };
}
