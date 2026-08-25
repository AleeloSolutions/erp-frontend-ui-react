import type { InvoiceData, InvoiceSettings } from "../types/invoice";
import { InvoiceMeta } from "../shared/InvoiceMeta";
import { InvoiceFooter } from "../shared/InvoiceFooter";
import { tableStyles } from "../config/tableStyles";
import { buildInvoiceQrValue } from "../lib/buildQrValue";

/**
 * Extracted from `InvoicePrintDocumentBackground` — same markup/classes,
 * now data- and settings-driven. The decorative circles use the layout's
 * primary color (as the original hardcoded `palette.orange` did) rather
 * than a fixed hex.
 */
const neutralMuted = "#6b7280";

export interface BubbleInvoiceProps {
  data: InvoiceData;
  settings: InvoiceSettings;
}

export function BubbleInvoice({ data, settings }: BubbleInvoiceProps) {
  const primary = settings.primaryColor;
  const secondary = settings.secondaryColor;
  const logoUrl = settings.logoUrl ?? data.company.logoUrl;
  const address = settings.address || data.company.address;
  const taxId = settings.taxId || data.company.taxId;
  const accountNumber = settings.bankAccount || data.invoice.accountNumber;
  const Table = tableStyles[settings.tableStyle].component;

  return (
    <div
      className="relative mx-auto flex w-[210mm] min-h-[297mm] shrink-0 flex-col overflow-hidden bg-white text-black shadow-md print:w-auto print:shadow-none"
      style={{ fontFamily: settings.font }}
    >
      <style>{"@page { size: A4; margin: 0; }"}</style>
      <svg
        width="360"
        height="360"
        viewBox="0 0 1100 1100"
        aria-hidden
        className="pointer-events-none absolute z-0"
        style={{ right: "-160px", top: "-200px" }}
      >
        <circle cx="550" cy="550" r="550" fill={primary} fillOpacity={0.12} />
      </svg>

      <div className="relative z-10 px-[15mm] pt-6 print:px-[10mm]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[13px] font-bold">
              {settings.tagline || data.company.name}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-9 w-9 object-contain" />
            ) : null}
            <div className="text-right text-[11px] leading-relaxed">
              {address ? <div className="whitespace-pre-line">{address}</div> : null}
              {taxId ? <div>Tax ID: {taxId}</div> : null}
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-start justify-between gap-4">
          <div className="text-[12px]">{data.customer.name}</div>
          <h2
            className="text-right text-[1.75rem] font-normal"
            style={{ color: primary }}
          >
            Invoice {data.invoice.number}
          </h2>
        </div>

        <InvoiceMeta
          date={data.invoice.date}
          dueDate={data.invoice.dueDate}
          accentColor={secondary}
          className="mb-6 mt-4 max-w-sm"
        />
      </div>

      <div className="relative z-10 px-[15mm] print:px-[10mm]">
        <Table
          items={data.items}
          totals={data.totals}
          paymentInfo={{
            paymentTerms: data.invoice.paymentTerms,
            paymentReference: data.invoice.paymentReference ?? data.invoice.number,
            accountNumber,
          }}
          qrValue={settings.showQrCode ? buildInvoiceQrValue(data) : undefined}
          accentColor={primary}
        />
      </div>

      <InvoiceFooter
        companyName={settings.tagline || data.company.name}
        accentColor={primary}
        mutedColor={neutralMuted}
        footerText={settings.footerText}
      >
        <svg
          width="360"
          height="360"
          viewBox="0 0 1100 1100"
          aria-hidden
          className="pointer-events-none absolute z-0"
          style={{ left: "-160px", bottom: "-200px" }}
        >
          <circle cx="550" cy="550" r="550" fill={primary} fillOpacity={0.12} />
        </svg>
      </InvoiceFooter>
    </div>
  );
}
