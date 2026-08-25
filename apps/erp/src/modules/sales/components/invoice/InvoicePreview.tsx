import type { InvoiceData, InvoiceSettings } from "./types/invoice";
import { invoiceLayouts } from "./config/invoiceLayouts";

/**
 * Minimal preview: looks up the active layout from the registry and
 * renders it. No panel/chrome yet — that's `InvoiceCustomizer` (Step 4).
 */
export interface InvoicePreviewProps {
  data: InvoiceData;
  settings: InvoiceSettings;
}

export function InvoicePreview({ data, settings }: InvoicePreviewProps) {
  const Layout = invoiceLayouts[settings.layout].component;
  return <Layout data={data} settings={settings} />;
}
