import type { InvoiceData, InvoiceSettings } from "../types/invoice";
import { InvoiceMeta } from "../shared/InvoiceMeta";
import { tableStyles } from "../config/tableStyles";
import { buildInvoiceQrValue } from "../lib/buildQrValue";

/**
 * Extracted from `InvoicePrintDocumentDualHeader` — same markup/classes,
 * now data- and settings-driven instead of hardcoding "Germany LTD." and a
 * fixed orange/dark-red palette. The two decorative SVG paths are the exact
 * paths from the Odoo source markup (see the original component's notes).
 */
const neutralMuted = "#6b7280";

export interface DualInvoiceProps {
  data: InvoiceData;
  settings: InvoiceSettings;
}

export function DualInvoice({ data, settings }: DualInvoiceProps) {
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
        width="100%"
        height="60"
        viewBox="0 0 1000 60"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-0"
      >
        <path d="M0 0H1000V16L0 60Z" fill={primary} fillOpacity={0.15} />
      </svg>
      <svg
        width="70"
        height="140"
        viewBox="0 0 80 160"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-0"
      >
        <path d="M0 0H80L0 160Z" fill={secondary} fillOpacity={0.15} />
      </svg>

      <div className="relative z-10 px-[15mm] pt-6 print:px-[10mm]">
        <div className="flex items-start justify-between py-4">
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-20 w-20 object-contain" />
            ) : null}
            <div className="mt-1 text-[13px] font-bold">
              {settings.tagline || data.company.name}
            </div>
          </div>
          <div className="text-right text-[11px] leading-relaxed">
            {address ? <div className="whitespace-pre-line">{address}</div> : null}
            {taxId ? <div>Tax ID: {taxId}</div> : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-4">
          <div className="text-[12px]">{data.customer.name}</div>
          <h2
            className="text-right text-[1.35rem] font-normal"
            style={{ color: primary }}
          >
            Invoice {data.invoice.number}
          </h2>
        </div>

        <InvoiceMeta
          date={data.invoice.date}
          dueDate={data.invoice.dueDate}
          accentColor={secondary}
          className="mb-6 mt-3 max-w-sm"
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
          secondaryColor={secondary}
        />
      </div>

      <div className="relative z-10 mt-auto px-[15mm] pb-8 pt-16 print:px-[10mm]">
        <div className="flex items-end justify-between gap-4">
          {settings.footerText ? (
            <div
              className="min-w-0 truncate text-[1.4rem] font-extrabold"
              style={{ color: primary }}
            >
              {settings.footerText}
            </div>
          ) : (
            <div />
          )}
          <div className="shrink-0 text-[12px] font-bold">
            {settings.tagline || data.company.name}
          </div>
        </div>
        <div className="mt-2 text-center text-[10px]" style={{ color: neutralMuted }}>
          Page 1 / 1
        </div>
      </div>
    </div>
  );
}
