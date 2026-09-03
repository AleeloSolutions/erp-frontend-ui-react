/**
 * Settings → Company Info against the Django backend.
 *
 * Company identity is split across two endpoints: the tenant row
 * (`/clients/me/` — the name) and its settings (`/client-config/` —
 * address, tax number, contact details). This hook presents them as one
 * `CompanyInfo` and saves back to both.
 *
 * Deliberately plain state + effect (no React Query): Settings renders
 * inside Storybook stories where no QueryProvider exists; there the
 * fetch simply never runs and the demo defaults stay.
 */

import { useCallback, useEffect, useState } from "react";
import { formatAddress, type AddressParts } from "@/lib/address";
import { apiGet, apiPatch } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";
import { defaultInvoiceSettings } from "@/modules/sales/components/invoice/config/defaultSettings";
import { invoiceLayouts } from "@/modules/sales/components/invoice/config/invoiceLayouts";
import { tableStyles } from "@/modules/sales/components/invoice/config/tableStyles";
import type {
  InvoiceSettings,
  LayoutKey,
  TableStyleKey,
} from "@/modules/sales/components/invoice/types/invoice";
import { defaultCompanyInfo, type CompanyInfo } from "./settingsCompany";

interface ClientDetail {
  uuid: string;
  name: string;
  slug: string;
  status: string;
  trial_ends_at: string | null;
}

/** `/client-config/` — one row per tenant (al_client_settings). The
 * address is structured columns on the backend, never one blob. */
interface ClientSettingsDto {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  tax_number: string;
  contact_email: string;
  contact_phone: string;
  language: string;
  country: string;
  timezone: string;
  currency: string;
  team_size: string;
  primary_interest: string;
}

export function useCompanyInfo() {
  const [info, setInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    void Promise.all([
      apiGet<ClientDetail>("/v1/clients/me/"),
      apiGet<ClientSettingsDto>("/v1/client-config/"),
    ])
      .then(([client, config]) => {
        if (cancelled) return;
        setInfo({
          name: client.name,
          slug: client.slug,
          status: client.status,
          trialEndsAt: client.trial_ends_at,
          ...addressParts(config),
          taxNumber: config.tax_number ?? "",
          email: config.contact_email ?? "",
          phone: config.contact_phone ?? "",
          language: config.language,
          country: config.country,
          timezone: config.timezone,
          currency: config.currency,
          teamSize: config.team_size,
          primaryInterest: config.primary_interest,
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

  // slug/status/trial_ends_at are deliberately absent: the backend rejects
  // changes to them from this screen.
  const save = useCallback(async (values: CompanyInfo) => {
    await Promise.all([
      apiPatch("/v1/clients/me/", { name: values.name }),
      apiPatch("/v1/client-config/", {
        ...addressColumns(values),
        tax_number: values.taxNumber,
        contact_email: values.email,
        contact_phone: values.phone,
        language: values.language,
        country: values.country,
        timezone: values.timezone,
        currency: values.currency,
        team_size: values.teamSize,
        primary_interest: values.primaryInterest,
      }),
    ]);
    setInfo(values);
  }, []);

  return { info, loaded, save };
}

/**
 * Settings → Document Layout, backed by its own `/document-layout/` row.
 * The company's address and tax number live on `/client-config/` (they
 * are identity, not styling) but the customizer edits them alongside the
 * preview, so this hook reads both and writes each field back where it
 * belongs.
 */
interface DocumentLayoutDto {
  layout: string;
  table_style: string;
  font: string;
  paper_format: string;
  has_qr_code: boolean;
  primary_color: string;
  secondary_color: string;
  tagline: string;
  footer_text: string;
  bank_account: string;
  logo: string | null;
}

type CompanyIdentityDto = Pick<
  ClientSettingsDto,
  "address_line1" | "address_line2" | "city" | "state" | "postal_code" | "tax_number"
>;

function addressParts(dto: Partial<CompanyIdentityDto>): AddressParts {
  return {
    addressLine1: dto.address_line1 ?? "",
    addressLine2: dto.address_line2 ?? "",
    city: dto.city ?? "",
    state: dto.state ?? "",
    postalCode: dto.postal_code ?? "",
  };
}

function addressColumns(parts: Partial<AddressParts>) {
  return {
    address_line1: parts.addressLine1 ?? "",
    address_line2: parts.addressLine2 ?? "",
    city: parts.city ?? "",
    state: parts.state ?? "",
    postal_code: parts.postalCode ?? "",
  };
}

/** A stored key the renderer doesn't know would blow up the preview
 * (`invoiceLayouts[key].component` on undefined), so fall back instead of
 * trusting the column. Casting here was exactly what hid a bad default. */
function knownLayout(value: string): LayoutKey {
  return value in invoiceLayouts ? (value as LayoutKey) : defaultInvoiceSettings.layout;
}

function knownTableStyle(value: string): TableStyleKey {
  return value in tableStyles
    ? (value as TableStyleKey)
    : defaultInvoiceSettings.tableStyle;
}

function toInvoiceSettings(
  dto: DocumentLayoutDto,
  identity: CompanyIdentityDto
): InvoiceSettings {
  const parts = addressParts(identity);
  return {
    layout: knownLayout(dto.layout),
    tableStyle: knownTableStyle(dto.table_style),
    font: dto.font || defaultInvoiceSettings.font,
    primaryColor: dto.primary_color || defaultInvoiceSettings.primaryColor,
    secondaryColor: dto.secondary_color || defaultInvoiceSettings.secondaryColor,
    paperFormat: dto.paper_format === "Letter" ? "Letter" : "A4",
    showQrCode: Boolean(dto.has_qr_code),
    logoUrl: dto.logo ?? undefined,
    tagline: dto.tagline || undefined,
    footerText: dto.footer_text || undefined,
    bankAccount: dto.bank_account || undefined,
    ...parts,
    address: formatAddress(parts) || undefined,
    taxId: identity.tax_number || undefined,
  };
}

/** The picker hands us a `blob:` URL for a freshly chosen file; turn it
 * back into something uploadable. Anything else is already-stored and
 * must not be re-sent. */
async function blobFromObjectUrl(url: string): Promise<{ blob: Blob; filename: string }> {
  const blob = await fetch(url).then((response) => response.blob());
  const extension = blob.type.split("/")[1]?.split("+")[0] || "png";
  return { blob, filename: `logo.${extension}` };
}

export function useDocumentLayout() {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    void Promise.all([
      apiGet<DocumentLayoutDto>("/v1/document-layout/"),
      apiGet<CompanyIdentityDto>("/v1/client-config/"),
    ])
      .then(([dto, identity]) => {
        if (cancelled) return;
        setSettings(toInvoiceSettings(dto, identity));
        setLoaded(true);
      })
      .catch(() => {
        // Not on a tenant subdomain (or offline): keep the demo defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (next: InvoiceSettings) => {
    const layoutFields: Record<string, string> = {
      layout: next.layout,
      table_style: next.tableStyle,
      font: next.font,
      paper_format: next.paperFormat,
      has_qr_code: String(next.showQrCode),
      primary_color: next.primaryColor,
      secondary_color: next.secondaryColor,
      tagline: next.tagline ?? "",
      footer_text: next.footerText ?? "",
      bank_account: next.bankAccount ?? "",
    };
    const identityFields = {
      ...addressColumns(next),
      tax_number: next.taxId ?? "",
    };

    let savedLayout: DocumentLayoutDto;
    if (next.logoUrl?.startsWith("blob:")) {
      // A newly picked file: multipart, so the logo lands in storage and
      // comes back as a URL that survives a reload.
      const { blob, filename } = await blobFromObjectUrl(next.logoUrl);
      const form = new FormData();
      for (const [key, value] of Object.entries(layoutFields)) form.append(key, value);
      form.append("logo", blob, filename);
      savedLayout = await apiPatch<DocumentLayoutDto>("/v1/document-layout/", form, {
        rawBody: true,
      });
    } else {
      savedLayout = await apiPatch<DocumentLayoutDto>(
        "/v1/document-layout/",
        layoutFields
      );
    }
    const savedIdentity = await apiPatch<CompanyIdentityDto>(
      "/v1/client-config/",
      identityFields
    );
    setSettings(toInvoiceSettings(savedLayout, savedIdentity));
  }, []);

  return { settings, loaded, save };
}
