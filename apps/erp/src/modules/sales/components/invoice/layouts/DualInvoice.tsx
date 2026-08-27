import type { InvoiceData, InvoiceSettings } from "../types/invoice";
import { InvoiceMeta } from "../shared/InvoiceMeta";
import { InvoiceSeal } from "../shared/InvoiceSeal";
import { InvoiceStub } from "../shared/InvoiceStub";
import { InvoiceFold } from "../shared/InvoiceFold";
import { InvoiceLogoBadge } from "../shared/InvoiceLogoBadge";
import { InvoicePaymentInfo } from "../shared/InvoicePaymentInfo";
import { LEDGER_SEAL_THEME_CSS, ledgerSealThemeVars, FRAUNCES } from "../shared/theme";
import { companyInitials } from "../lib/companyInitials";
import { tableStyles } from "../config/tableStyles";
import { buildInvoiceQrValue } from "../lib/buildQrValue";
import { InvoiceSpine } from "../shared/InvoiceSpine";

/**
 * Dual's own composition (left-anchored branding, right-anchored invoice
 * meta, footer-text-left/company-name-right footer) stays; the Ledger Seal
 * pass replaces its Odoo-derived skin (SVG wave/triangle, plain invoice
 * number, bordered totals box) with the shared spine/seal/stub vocabulary.
 * The vertical spine sits naturally here since Dual was already left-
 * anchored, unlike Center.
 */
export interface DualInvoiceProps {
  data: InvoiceData;
  settings: InvoiceSettings;
}

export function DualInvoice({ data, settings }: DualInvoiceProps) {
  const primary = settings.primaryColor;
  const secondary = settings.secondaryColor;
  const logoUrl = settings.logoUrl ?? data.company.logoUrl;
  const address = settings.address || data.company.address;
  const accountNumber = settings.bankAccount || data.invoice.accountNumber;
  const companyName = settings.tagline || data.company.name;
  const Table = tableStyles[settings.tableStyle].component;

  return (
    <div
      className="ls-theme relative mx-auto flex w-[210mm] min-h-[297mm] shrink-0 overflow-hidden bg-white shadow-md print:w-auto print:shadow-none"
      style={{
        fontFamily: settings.font,
        color: "var(--ls-ink)",
        ...ledgerSealThemeVars(primary, secondary),
      }}
    >
      <style>{"@page { size: A4; margin: 0; }"}</style>
      <style>{LEDGER_SEAL_THEME_CSS}</style>

      <InvoiceSpine primary={primary} secondary={secondary} />

      <div className="relative flex min-w-0 flex-1 flex-col px-11 pb-5 pt-6 print:px-8">
        <InvoiceFold />

        <div className="relative z-[2] flex items-center gap-3">
          <InvoiceLogoBadge
            logoUrl={logoUrl}
            initials={companyInitials(data.company.name)}
          />
          <div className="min-w-0">
            <div
              className="truncate text-[17px] font-semibold"
              style={{ fontFamily: FRAUNCES }}
            >
              {companyName}
            </div>
          </div>
        </div>

        <div className="relative z-[2] mt-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[.07em] text-black">
              Billed to
            </div>
            <div className="mt-1 truncate text-[15px] font-semibold">
              {data.customer.name}
              <div
                className="whitespace-pre-line text-[11.5px] leading-relaxed"
                style={{ color: "var(--ls-ink-soft)" }}
              >
                {address}
              </div>
            </div>
          </div>
          <InvoiceSeal
            label="Invoice"
            number={data.invoice.number.replace("INV/", "")}
            size={96}
          />
        </div>

        <div className="relative z-[2] mt-5">
          <InvoiceMeta
            date={data.invoice.date}
            dueDate={data.invoice.dueDate}
            accentColor={secondary}
          />
        </div>

        <div className="relative z-[2] mt-6">
          <Table
            items={data.items}
            currencySuffix={data.totals.currencySuffix}
            accentColor={primary}
            secondaryColor={secondary}
          />
        </div>

        <div className="relative z-[2] mt-5 flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1 text-[11.5px]">
            <InvoicePaymentInfo
              paymentInfo={{
                paymentTerms: data.invoice.paymentTerms,
                paymentReference: data.invoice.paymentReference ?? data.invoice.number,
                accountNumber,
              }}
              qrValue={settings.showQrCode ? buildInvoiceQrValue(data) : undefined}
            />
          </div>
          <InvoiceStub totals={data.totals} primary={primary} />
        </div>

        <div
          className="relative z-[2] mt-auto border-t pt-4"
          style={{ borderColor: "var(--ls-line)" }}
        >
          <div className="flex items-end justify-between gap-4">
            {settings.footerText ? (
              <div
                className="min-w-0 truncate text-[1.15rem] font-semibold"
                style={{ fontFamily: FRAUNCES, color: primary }}
              >
                {settings.footerText}
              </div>
            ) : (
              <div />
            )}
            <div className="shrink-0 text-[12px] font-medium">{companyName}</div>
          </div>
          <div
            className="mt-1.5 text-center text-[10px]"
            style={{ color: "var(--ls-ink-soft)" }}
          >
            Page 1 / 1
          </div>
        </div>
      </div>
    </div>
  );
}
