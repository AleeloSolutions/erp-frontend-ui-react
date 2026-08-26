import type { InvoiceData, InvoiceSettings } from "../types/invoice";
import { InvoiceMeta } from "../shared/InvoiceMeta";
import { InvoiceFooter } from "../shared/InvoiceFooter";
import { InvoiceSpine } from "../shared/InvoiceSpine";
import { InvoiceSeal } from "../shared/InvoiceSeal";
import { InvoiceStub } from "../shared/InvoiceStub";
import { InvoiceLogoBadge } from "../shared/InvoiceLogoBadge";
import { InvoicePaymentInfo } from "../shared/InvoicePaymentInfo";
import { LEDGER_SEAL_THEME_CSS, ledgerSealThemeVars, FRAUNCES } from "../shared/theme";
import { companyInitials } from "../lib/companyInitials";
import { tableStyles } from "../config/tableStyles";
import { buildInvoiceQrValue } from "../lib/buildQrValue";

/**
 * Bubble's own composition (name top-left / logo+address top-right — the
 * mirror of Dual's arrangement — plus its corner-circle decorations) stays;
 * the circles are Bubble's own distinctive touch on top of the shared
 * spine/seal/stub vocabulary, not replaced by it.
 */
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
      {/*
        Each circle is clipped by its own small corner box (not the root's
        overflow-hidden) sized to just the visible sliver. Chrome's print
        pagination was observed treating the root's full off-page overflow
        (a 360px circle hanging 200px past the bottom edge) as real content
        needing a second page, even though it's only ever visually clipped —
        a dedicated same-size clip box keeps the "off-page" part truly out of
        the printed content's extent instead of merely hidden from view.
      */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 overflow-hidden"
        style={{ width: 200, height: 160 }}
        aria-hidden
      >
        <svg
          width="360"
          height="360"
          viewBox="0 0 1100 1100"
          className="absolute"
          style={{ right: "-160px", top: "-200px" }}
        >
          <circle cx="550" cy="550" r="550" fill={primary} fillOpacity={0.1} />
        </svg>
      </div>
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-0 overflow-hidden"
        style={{ width: 200, height: 160 }}
        aria-hidden
      >
        <svg
          width="360"
          height="360"
          viewBox="0 0 1100 1100"
          className="absolute"
          style={{ left: "-160px", bottom: "-200px" }}
        >
          <circle cx="550" cy="550" r="550" fill={primary} fillOpacity={0.1} />
        </svg>
      </div>

      <InvoiceSpine
        mark={companyInitials(data.company.name)}
        primary={primary}
        secondary={secondary}
      />

      <div className="relative flex min-w-0 flex-1 flex-col px-11 pb-2 pt-3 print:px-8">
        <div className="relative z-[2] flex items-start justify-between gap-4">
          <div
            className="min-w-0 truncate text-[16px] font-semibold"
            style={{ fontFamily: FRAUNCES }}
          >
            {companyName}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <InvoiceLogoBadge
              logoUrl={logoUrl}
              initials={companyInitials(data.company.name)}
              size={30}
            />
            <div
              className="whitespace-pre-line text-right text-[11px] leading-snug"
              style={{ color: "var(--ls-ink-soft)" }}
            >
              {address}
              {taxId ? <div>Tax ID {taxId}</div> : null}
            </div>
          </div>
        </div>

        <div className="relative z-[2] mt-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[.08em]"
              style={{ color: "var(--ls-ink-soft)" }}
            >
              Billed to
            </div>
            <div className="mt-1 truncate text-[15px] font-semibold">
              {data.customer.name}
            </div>
          </div>
          <InvoiceSeal
            label="Invoice"
            number={data.invoice.number.replace("INV/", "")}
            size={96}
          />
        </div>

        <div className="relative z-[2] mt-2">
          <InvoiceMeta
            date={data.invoice.date}
            dueDate={data.invoice.dueDate}
            accentColor={secondary}
          />
        </div>

        <div className="relative z-[2] mt-2">
          <Table
            items={data.items}
            currencySuffix={data.totals.currencySuffix}
            accentColor={primary}
          />
        </div>

        <div className="relative z-[2] mt-2 flex items-start justify-between gap-6">
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

        <InvoiceFooter
          companyName={companyName}
          accentColor={primary}
          mutedColor="var(--ls-ink-soft)"
          footerText={settings.footerText}
        />
      </div>
    </div>
  );
}
