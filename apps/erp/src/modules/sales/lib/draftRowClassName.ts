/** Full-row brand-third text for Draft records (delete icon stays red). */
export const DRAFT_ROW_CLASS_NAME =
  "[&>td]:!text-erp-brand-third [&>td_*:not(.text-erp-error)]:!text-erp-brand-third [&>td_.rounded-full]:!bg-erp-brand-third-overlay";

export function draftRowClassNameWhen(status: string): string | undefined {
  return status === "Draft" ? DRAFT_ROW_CLASS_NAME : undefined;
}
