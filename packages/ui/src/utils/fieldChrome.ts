import { cn } from "./cn";

export type FieldSize = "sm" | "md" | "default";

/**
 * Height is fixed (sm baseline).
 * Size variants differ by width only.
 */
export const fieldSizeClasses: Record<FieldSize, string> = {
  sm: "box-border h-9 min-h-9 px-3 text-xs leading-9",
  md: "box-border h-9 min-h-9 px-3 text-xs leading-9",
  default: "box-border h-9 min-h-9 px-3 text-xs leading-9",
};

/** Story / standalone width steps (forms use full column width). */
export const fieldMinWidthClasses: Record<FieldSize, string> = {
  sm: "w-48",
  md: "w-64",
  default: "w-80",
};

/** @deprecated Use fieldMinWidthClasses */
export const fieldSelectMinWidthClasses = fieldMinWidthClasses;

export const fieldIconSizeClasses: Record<FieldSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-3.5 w-3.5",
  default: "h-3.5 w-3.5",
};

export type FieldChromeOptions = {
  error?: boolean;
  /** Composite control: use :focus-within instead of :focus */
  within?: boolean;
  /** Force active primary border (e.g. popup open) */
  active?: boolean;
  /** Apply disabled look when the element isn't natively `:disabled` */
  disabled?: boolean;
};

/**
 * Shared “bottom + right” field chrome used by Input, Select, Textarea, DatePicker.
 * Hover = neutral gray; focus/active = primary; error = error red.
 */
export function fieldChromeClasses({
  error = false,
  within = false,
  active = false,
  disabled = false,
}: FieldChromeOptions = {}) {
  const focusBorder = within
    ? [
        "focus-within:border-b-erp-primary focus-within:border-r-erp-primary focus-within:rounded-br-[3px]",
        "focus-within:hover:border-b-erp-primary focus-within:hover:border-r-erp-primary",
        "focus-within:outline-none focus-within:ring-0",
        "focus-within:border-t-0 focus-within:border-l-0",
      ]
    : [
        "focus:border-b-erp-primary focus:border-r-erp-primary focus:rounded-br-[3px]",
        "focus-visible:border-b-erp-primary focus-visible:border-r-erp-primary",
        "focus:hover:border-b-erp-primary focus:hover:border-r-erp-primary",
        "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
        "focus:border-t-0 focus:border-l-0 focus-visible:border-t-0 focus-visible:border-l-0",
      ];

  const errorFocus = within
    ? "focus-within:border-b-erp-error focus-within:border-r-erp-error focus-within:hover:border-b-erp-error focus-within:hover:border-r-erp-error"
    : "focus:border-b-erp-error focus:border-r-erp-error focus:hover:border-b-erp-error focus:hover:border-r-erp-error";

  return cn(
    "bg-transparent text-erp-text",
    "rounded-none rounded-br-[2px] border-0 border-t-0 border-l-0",
    // Soft rest chrome so fields always read as fields (not floating text)
    "border-solid border-b border-r border-b-erp-border-soft border-r-erp-border-soft",
    "placeholder:text-erp-placeholder placeholder:opacity-100",
    "transition-[border-color,border-radius] duration-150",
    "hover:border-b-erp-border-strong hover:border-r-erp-border-strong hover:rounded-br-[3px]",
    focusBorder,
    active &&
      !error &&
      "border-b-erp-primary border-r-erp-primary rounded-br-[3px] hover:border-b-erp-primary hover:border-r-erp-primary",
    active && error && "border-b-erp-error border-r-erp-error rounded-br-[3px]",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "disabled:hover:border-b-erp-border-strong disabled:hover:border-r-erp-border-strong disabled:hover:rounded-br-[3px]",
    disabled && "cursor-not-allowed opacity-60",
    error &&
      cn(
        "border-b-erp-error/55 border-r-erp-error/55 hover:border-b-erp-error hover:border-r-erp-error",
        errorFocus
      )
  );
}
