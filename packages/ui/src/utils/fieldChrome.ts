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

/** Shared field border treatments. Default `corner` matches today’s Input/Select look. */
export type FieldChrome = "underline" | "corner" | "tick";
export type FieldChromeEdge = "end" | "start";

export type FieldChromeProps = {
  chrome?: FieldChrome;
  chromeEdge?: FieldChromeEdge;
};

export type FieldChromeOptions = FieldChromeProps & {
  error?: boolean;
  /** Composite control: use :focus-within instead of :focus */
  within?: boolean;
  /** Force active primary border (e.g. popup open) */
  active?: boolean;
  /** Apply disabled look when the element isn't natively `:disabled` */
  disabled?: boolean;
};

/**
 * Shared field chrome used by Input, Select, Textarea, DatePicker, Dropdown field trigger.
 * Hover = neutral gray; focus/active = primary; error = error red.
 * Side chrome uses logical edges (`border-e` / `border-s`) so it flips in RTL.
 *
 * `tick` = full bottom + half-height end stem + small outer arc, one color (see `.erp-field-tick`).
 */
export function fieldChromeClasses({
  chrome = "underline",
  chromeEdge = "end",
  error = false,
  within = false,
  active = false,
  disabled = false,
}: FieldChromeOptions = {}) {
  const edge = chrome === "underline" ? null : chromeEdge;
  const isEnd = edge === "end";
  const isCorner = chrome === "corner" && edge != null;
  const isTick = chrome === "tick" && edge != null;

  return cn(
    !isTick && "bg-transparent",
    "text-erp-text",
    "border-0 border-solid border-b border-t-0",
    !isTick && "border-b-erp-border-soft",
    isTick && "border-b-transparent",
    "placeholder:text-erp-placeholder placeholder:opacity-100",
    "transition-[border-color,border-radius,background-image] duration-150",
    "outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
    "focus:border-t-0 focus-visible:border-t-0 focus-within:outline-none focus-within:ring-0",
    !edge && "rounded-none border-e-0 border-s-0",
    isCorner && isEnd && "rounded-none rounded-ee-[2px] hover:rounded-ee-[3px]",
    isCorner && !isEnd && "rounded-none rounded-es-[2px] hover:rounded-es-[3px]",
    isCorner && isEnd && "border-e border-s-0 border-e-erp-border-soft",
    isCorner && !isEnd && "border-s border-e-0 border-s-erp-border-soft",
    isTick && "erp-field-tick rounded-none",
    isTick && (isEnd ? "erp-field-tick-end" : "erp-field-tick-start"),
    isTick && within && "erp-field-tick-within",
    isTick && active && "erp-field-tick-active",
    isTick && error && "erp-field-tick-error",
    !error && !isTick && "hover:border-b-erp-border-strong",
    isCorner && isEnd && !error && "hover:border-e-erp-border-strong",
    isCorner && !isEnd && !error && "hover:border-s-erp-border-strong",
    !error &&
      !isTick &&
      !within &&
      "focus:border-b-erp-primary focus-visible:border-b-erp-primary focus:hover:border-b-erp-primary",
    !error &&
      !isTick &&
      within &&
      "focus-within:border-b-erp-primary focus-within:hover:border-b-erp-primary",
    isCorner &&
      isEnd &&
      !error &&
      !within &&
      "focus:border-e-erp-primary focus-visible:border-e-erp-primary focus:hover:border-e-erp-primary",
    isCorner &&
      !isEnd &&
      !error &&
      !within &&
      "focus:border-s-erp-primary focus-visible:border-s-erp-primary focus:hover:border-s-erp-primary",
    isCorner &&
      isEnd &&
      !error &&
      within &&
      "focus-within:border-e-erp-primary focus-within:hover:border-e-erp-primary",
    isCorner &&
      !isEnd &&
      !error &&
      within &&
      "focus-within:border-s-erp-primary focus-within:hover:border-s-erp-primary",
    isCorner &&
      isEnd &&
      !within &&
      "focus:rounded-ee-[3px] focus-visible:rounded-ee-[3px]",
    isCorner &&
      !isEnd &&
      !within &&
      "focus:rounded-es-[3px] focus-visible:rounded-es-[3px]",
    isCorner && isEnd && within && "focus-within:rounded-ee-[3px]",
    isCorner && !isEnd && within && "focus-within:rounded-es-[3px]",
    active &&
      !error &&
      !isTick &&
      cn(
        "border-b-erp-primary hover:border-b-erp-primary",
        isCorner &&
          isEnd &&
          "rounded-ee-[3px] border-e-erp-primary hover:border-e-erp-primary",
        isCorner &&
          !isEnd &&
          "rounded-es-[3px] border-s-erp-primary hover:border-s-erp-primary"
      ),
    active &&
      error &&
      !isTick &&
      cn(
        "border-b-erp-error",
        isCorner && isEnd && "rounded-ee-[3px] border-e-erp-error",
        isCorner && !isEnd && "rounded-es-[3px] border-s-erp-error"
      ),
    "disabled:cursor-not-allowed disabled:opacity-60",
    !isTick && "disabled:hover:border-b-erp-border-strong",
    disabled && "cursor-not-allowed opacity-60",
    error &&
      !isTick &&
      cn(
        "border-b-erp-error/55 hover:border-b-erp-error",
        isCorner && isEnd && "border-e-erp-error/55 hover:border-e-erp-error",
        isCorner && !isEnd && "border-s-erp-error/55 hover:border-s-erp-error",
        !within && "focus:border-b-erp-error focus:hover:border-b-erp-error",
        within && "focus-within:border-b-erp-error focus-within:hover:border-b-erp-error",
        isCorner &&
          isEnd &&
          !within &&
          "focus:border-e-erp-error focus:hover:border-e-erp-error",
        isCorner &&
          !isEnd &&
          !within &&
          "focus:border-s-erp-error focus:hover:border-s-erp-error",
        isCorner &&
          isEnd &&
          within &&
          "focus-within:border-e-erp-error focus-within:hover:border-e-erp-error",
        isCorner &&
          !isEnd &&
          within &&
          "focus-within:border-s-erp-error focus-within:hover:border-s-erp-error"
      )
  );
}
