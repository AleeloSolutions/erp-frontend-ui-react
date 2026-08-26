import type { CSSProperties } from "react";

/**
 * "Ledger Seal" design language — the shared visual vocabulary for every
 * layout and table style (see claude-code-prompt-ledger-seal-full-replace.md).
 * Only `--ls-primary`/`--ls-secondary` come from `InvoiceSettings`; every
 * other token is derived from those two via `color-mix()`, matching the
 * reference's two-variable theming approach exactly. Custom properties
 * inherit through the DOM, so any descendant can reference `var(--ls-*)`
 * directly in an inline style without needing the values passed as props.
 */
export const LEDGER_SEAL_THEME_CSS = `
.ls-theme {
  --ls-primary-10: color-mix(in srgb, var(--ls-primary) 10%, white);
  --ls-primary-15: color-mix(in srgb, var(--ls-primary) 15%, white);
  --ls-primary-70: color-mix(in srgb, var(--ls-primary) 70%, white);
  --ls-primary-40a: color-mix(in srgb, var(--ls-primary) 40%, transparent);
  --ls-secondary-15: color-mix(in srgb, var(--ls-secondary) 15%, white);
  --ls-paper-tint: color-mix(in srgb, var(--ls-primary) 3%, white);
  --ls-line: color-mix(in srgb, var(--ls-primary) 16%, white);
  --ls-ink: #2b2420;
  --ls-ink-soft: #6b6058;
}

/* Ledger-tick table foundation (see Step 3 of the Ledger Seal pass): a small
   dot marker on each row's first cell and a two-tone gradient header rule —
   the shared base every table style (Striped/Light/Bordered) builds on. */
.ls-ledger-dot {
  position: relative;
}
.ls-ledger-dot::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ls-secondary);
}
.ls-ledger-tag {
  font-size: 10.5px;
  background: var(--ls-secondary-15);
  color: color-mix(in srgb, var(--ls-primary) 80%, black);
  padding: 1px 6px;
  border-radius: 5px;
  font-weight: 500;
}
`;

/** The two-tone gradient bottom rule used on every ledger-tick table header. */
export function ledgerHeaderRuleStyle(): CSSProperties {
  return {
    borderBottom: "2px solid transparent",
    borderImage: "linear-gradient(90deg, var(--ls-primary), var(--ls-secondary)) 1",
  };
}

export function ledgerSealThemeVars(primary: string, secondary: string): CSSProperties {
  return {
    ["--ls-primary" as string]: primary,
    ["--ls-secondary" as string]: secondary,
  } as CSSProperties;
}

export const FRAUNCES = "'Fraunces', serif";
export const JETBRAINS_MONO = "'JetBrains Mono', monospace";
