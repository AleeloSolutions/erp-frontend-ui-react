/**
 * "Invoice Date / Due Date" block — the label/value markup is identical
 * across all three current print designs, so that part is a genuine shared
 * piece. The wrapping grid's spacing/width is *not* identical, though:
 * Classic's original had no `max-w-sm` or extra top margin (its own
 * heading already provided spacing), while Dual's did — so callers supply
 * their own wrapper classes rather than this component silently imposing
 * one layout's spacing on every layout.
 */
export interface InvoiceMetaProps {
  date: string;
  dueDate?: string;
  /** Label color — the layout's secondary/accent brand color. */
  accentColor: string;
  /** Wrapper spacing/width — varies per layout, see note above. */
  className?: string;
}

export function InvoiceMeta({ date, dueDate, accentColor, className }: InvoiceMetaProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 text-[12px] ${className ?? ""}`}>
      <div>
        <strong style={{ color: accentColor }}>Invoice Date</strong>
        <div>{date}</div>
      </div>
      {dueDate ? (
        <div>
          <strong style={{ color: accentColor }}>Due Date</strong>
          <div>{dueDate}</div>
        </div>
      ) : null}
    </div>
  );
}
