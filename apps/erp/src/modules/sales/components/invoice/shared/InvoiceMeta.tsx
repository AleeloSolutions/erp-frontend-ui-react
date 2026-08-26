/**
 * "Invoice Date / Due Date" block — the label/value markup is identical
 * across all three current print designs, so that part is a genuine shared
 * piece. The wrapping grid's spacing/width is *not* identical, though:
 * Classic's original had no `max-w-sm` or extra top margin (its own
 * heading already provided spacing), while Dual's did — so callers supply
 * their own wrapper classes rather than this component silently imposing
 * one layout's spacing on every layout.
 *
 * Restyled as a pair of left-border "date chips" (`.dchip` in the Ledger
 * Seal reference) rather than plain label/value text.
 */
export interface InvoiceMetaProps {
  date: string;
  dueDate?: string;
  /** Chip border color — the layout's secondary/accent brand color. */
  accentColor: string;
  /** Wrapper spacing/width — varies per layout, see note above. */
  className?: string;
}

function DateChip({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <div className="border-l-2 pl-2.5" style={{ borderColor: accentColor }}>
      <div
        className="text-[10px] font-semibold uppercase tracking-[.07em]"
        style={{ color: "var(--ls-ink-soft)" }}
      >
        {label}
      </div>
      <div className="mt-px text-[13.5px] font-medium" style={{ color: "var(--ls-ink)" }}>
        {value}
      </div>
    </div>
  );
}

export function InvoiceMeta({ date, dueDate, accentColor, className }: InvoiceMetaProps) {
  return (
    <div className={`flex gap-8 text-[12px] ${className ?? ""}`}>
      <DateChip label="Invoice date" value={date} accentColor={accentColor} />
      {dueDate ? (
        <DateChip label="Due date" value={dueDate} accentColor={accentColor} />
      ) : null}
    </div>
  );
}
