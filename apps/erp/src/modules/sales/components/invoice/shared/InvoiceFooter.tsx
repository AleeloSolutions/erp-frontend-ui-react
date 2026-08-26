import { FRAUNCES } from "./theme";

/**
 * Centered "big footer text + page number" footer — identical between
 * Center and Bubble today, so it's shared here. Dual's footer is a
 * genuinely different arrangement (footer text left / company name right)
 * and keeps its own bespoke markup in DualInvoice. Bubble's corner-circle
 * decorations now render at the root level (see BubbleInvoice) since their
 * position is measured from the full page, not this footer band.
 *
 * `footerText` keeps the large/accent treatment from the prior fix (it's
 * the primary bottom-of-page message, not a small caption); `companyName`
 * repeats the same name shown next to the logo in the header (the caller
 * passes the tagline in place of the company name when one is set, same as
 * the header does).
 */
export interface InvoiceFooterProps {
  companyName?: string;
  accentColor: string;
  mutedColor: string;
  footerText?: string;
}

export function InvoiceFooter({
  companyName,
  accentColor,
  mutedColor,
  footerText,
}: InvoiceFooterProps) {
  return (
    <div
      className="relative z-10 mt-auto border-t px-11 pb-2 pt-2 text-center print:px-8"
      style={{ borderColor: "var(--ls-line)" }}
    >
      <div className="relative">
        {footerText ? (
          <div
            className="text-[1.1rem] font-semibold"
            style={{ fontFamily: FRAUNCES, color: accentColor }}
          >
            {footerText}
          </div>
        ) : null}
        {companyName ? (
          <div
            className={
              footerText ? "mt-1 text-[12px] font-medium" : "text-[12px] font-medium"
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
