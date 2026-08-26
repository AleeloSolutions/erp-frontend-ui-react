import type { InvoiceData, InvoiceSettings } from "../types/invoice";
import { InvoiceMeta } from "../shared/InvoiceMeta";
import { InvoiceFooter } from "../shared/InvoiceFooter";
import { InvoiceSpine } from "../shared/InvoiceSpine";
import { InvoiceSeal } from "../shared/InvoiceSeal";
import { InvoiceStub } from "../shared/InvoiceStub";
import { InvoiceLogoBadge } from "../shared/InvoiceLogoBadge";
import { InvoicePaymentInfo } from "../shared/InvoicePaymentInfo";
import { LEDGER_SEAL_THEME_CSS, ledgerSealThemeVars } from "../shared/theme";
import { companyInitials } from "../lib/companyInitials";
import { tableStyles } from "../config/tableStyles";
import { buildInvoiceQrValue } from "../lib/buildQrValue";

/**
 * Center's own composition (centered logo/branding column between two side
 * columns, centered footer) stays; only the skin changes. A running left
 * rail would fight the centered arrangement, so the spine is adapted to a
 * thin horizontal bar across the top instead of dropped (per the doc's
 * explicit allowance for layouts without an obvious vertical-rail slot).
 */
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
  const companyName = settings.tagline || data.company.name;
  const Table = tableStyles[settings.tableStyle].component;

  return (
    <div
      className="ls-theme mx-auto flex w-[210mm] min-h-[297mm] shrink-0 flex-col bg-white shadow-md print:w-auto print:shadow-none"
      style={{
        fontFamily: settings.font,
        color: "var(--ls-ink)",
        ...ledgerSealThemeVars(primary, secondary),
      }}
    >
      <style>{"@page { size: A4; margin: 0; }"}</style>
      <style>{LEDGER_SEAL_THEME_CSS}</style>

      <InvoiceSpine
        orientation="horizontal"
        mark={companyInitials(data.company.name)}
        primary={primary}
        secondary={secondary}
      />

      <div className="grid grid-cols-3 items-start gap-4 px-[15mm] py-6 print:px-[10mm]">
        <ul
          className="m-0 list-none whitespace-pre-line p-0 text-[11px] leading-relaxed"
          style={{ color: "var(--ls-ink-soft)" }}
        >
          {address ? <li>{address}</li> : null}
          {taxId ? (
            <li>
              Tax ID <span>{taxId}</span>
            </li>
          ) : null}
        </ul>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <InvoiceLogoBadge
            logoUrl={logoUrl}
            initials={companyInitials(data.company.name)}
          />
          <div className="text-[13px] font-semibold">{companyName}</div>
        </div>
        <div className="text-right text-[12px]">{data.customer.name}</div>
      </div>

      <div className="flex flex-1 flex-col px-[15mm] print:px-[10mm]">
        <div className="flex items-end justify-between gap-4">
          <InvoiceMeta
            date={data.invoice.date}
            dueDate={data.invoice.dueDate}
            accentColor={secondary}
          />
          <InvoiceSeal
            label="Invoice"
            number={data.invoice.number.replace("INV/", "")}
            size={96}
          />
        </div>

        <div className="mt-4">
          <Table
            items={data.items}
            currencySuffix={data.totals.currencySuffix}
            accentColor={primary}
            secondaryColor={secondary}
          />
        </div>

        <div className="mt-4 flex flex-1 items-start justify-between gap-6">
          <div className="min-w-0 flex-1 text-[11.5px]">
            <InvoicePaymentInfo
              paymentInfo={{
                paymentReference: data.invoice.paymentReference ?? data.invoice.number,
              }}
              qrValue={settings.showQrCode ? buildInvoiceQrValue(data) : undefined}
            />
          </div>
          <InvoiceStub totals={data.totals} primary={primary} />
        </div>
      </div>

      <InvoiceFooter
        companyName={companyName}
        accentColor={primary}
        mutedColor="var(--ls-ink-soft)"
        footerText={settings.footerText}
      />
    </div>
  );
}
