/**
 * Top-right folded-corner decoration (`.fold` in the reference) — two
 * stacked CSS border-triangles in `--ls-primary-10` / `--ls-secondary-15`.
 * Replaces Odoo's blob/wave/triangle corner decorations on every layout.
 */
export function InvoiceFold() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 h-[150px] w-[190px] overflow-hidden">
      <div
        className="absolute right-0 top-0 h-0 w-0"
        style={{
          borderStyle: "solid",
          borderWidth: "0 190px 150px 0",
          borderColor: "transparent var(--ls-primary-10) transparent transparent",
        }}
      />
      <div
        className="absolute right-0 top-0 h-0 w-0"
        style={{
          borderStyle: "solid",
          borderWidth: "0 130px 100px 0",
          borderColor: "transparent var(--ls-secondary-15) transparent transparent",
        }}
      />
    </div>
  );
}
