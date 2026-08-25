import type { ReactNode } from "react";

/**
 * Centered "big footer text + page number" footer — identical between
 * Classic and Background today, so it's shared here. Dual's footer is a
 * genuinely different arrangement (footer text left / company name right)
 * and keeps its own bespoke markup in DualInvoice.
 *
 * `children` is an optional decoration overlay (Background's corner-circle
 * SVG needs one) — `relative` on the wrapper costs nothing visually when
 * unused, so it's included now rather than reshaping this component again
 * on the next pass.
 *
 * The customer's email used to render here; it's been dropped from the
 * footer UI entirely, and `footerText` now takes the large/bold/accent
 * treatment that slot used to have — this is the primary bottom-of-page
 * message now, not a small caption.
 *
 * `companyName` repeats the same bold name shown next to the logo in the
 * header (the caller passes the tagline in place of the company name when
 * one is set, same as the header does), so the document re-affirms its
 * branding at the bottom the same way it does at the top.
 */
export interface InvoiceFooterProps {
  companyName?: string;
  accentColor: string;
  mutedColor: string;
  footerText?: string;
  children?: ReactNode;
}

export function InvoiceFooter({
  companyName,
  accentColor,
  mutedColor,
  footerText,
  children,
}: InvoiceFooterProps) {
  return (
    <div className="relative z-10 mt-auto px-[15mm] pb-8 pt-16 text-center print:px-[10mm]">
      {children}
      <div className="relative">
        {footerText ? (
          <div className="text-[1.4rem] font-extrabold" style={{ color: accentColor }}>
            {footerText}
          </div>
        ) : null}
        {companyName ? (
          <div
            className={
              footerText ? "mt-2 text-[12px] font-bold" : "text-[12px] font-bold"
            }
          >
            {companyName}
          </div>
        ) : null}
        <div
          className={footerText || companyName ? "mt-1 text-[10px]" : "text-[10px]"}
          style={{ color: mutedColor }}
        >
          Page 1 / 1
        </div>
      </div>
    </div>
  );
}
