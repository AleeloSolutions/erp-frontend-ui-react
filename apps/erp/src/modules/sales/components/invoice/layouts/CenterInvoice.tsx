import type { InvoiceData, InvoiceSettings } from "../types/invoice";
import { InvoiceMeta } from "../shared/InvoiceMeta";
import { InvoiceFooter } from "../shared/InvoiceFooter";
import { tableStyles } from "../config/tableStyles";
import { buildInvoiceQrValue } from "../lib/buildQrValue";

/**
 * Extracted from `InvoicePrintDocumentClassic` — same markup/classes, now
 * data- and settings-driven. `headerBg`/`mutedColor` stay internal
 * constants (like Dual's neutrals) since they aren't part of
 * `InvoiceSettings`'s primary/secondary pair.
 */
const headerBg = "#faf0e6";
const mutedColor = "#6b7280";

export interface CenterInvoiceProps {
  data: InvoiceData;
  settings: InvoiceSettings;
}

export function CenterInvoice({ data, settings }: CenterInvoiceProps) {
  const primary = settings.primaryColor;
  const secondary = settings.secondaryColor;
  const logoUrl = settings.logoUrl ?? data.company.logoUrl;
  const address = settings.address || data.company.address;
  const taxId = settings.taxId || data.company.taxId;
  const accountNumber = settings.bankAccount || data.invoice.accountNumber;
  const Table = tableStyles[settings.tableStyle].component;

  return (
    <div
      className="mx-auto flex w-[210mm] min-h-[297mm] shrink-0 flex-col bg-white text-black shadow-md print:w-auto print:shadow-none"
      style={{ fontFamily: settings.font }}
    >
      <style>{"@page { size: A4; margin: 0; }"}</style>
      <div
        className="grid grid-cols-3 items-start gap-4 px-[15mm] py-6 print:px-[10mm]"
        style={{ backgroundColor: headerBg }}
      >
        <ul className="m-0 list-none p-0 text-[11px] leading-relaxed">
          {address ? <li className="whitespace-pre-line">{address}</li> : null}
          {taxId ? (
            <li>
              <span>Tax ID</span>: <span>{taxId}</span>
            </li>
          ) : null}
        </ul>
        <div className="text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="mx-auto mb-1 h-16 w-16 object-contain"
            />
          ) : null}
          <div className="text-[13px] font-bold">
            {settings.tagline || data.company.name}
          </div>
        </div>
        <div className="text-right text-[12px]">{data.customer.name}</div>
      </div>

      <div className="px-[15mm] print:px-[10mm]">
        <h2 className="mb-4 mt-6 text-[1.75rem] font-normal" style={{ color: primary }}>
          Invoice {data.invoice.number}
        </h2>

        <InvoiceMeta
          date={data.invoice.date}
          dueDate={data.invoice.dueDate}
          accentColor={secondary}
          className="mb-6"
        />

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

      <InvoiceFooter
        companyName={settings.tagline || data.company.name}
        accentColor={primary}
        mutedColor={mutedColor}
        footerText={settings.footerText}
      />
    </div>
  );
}
