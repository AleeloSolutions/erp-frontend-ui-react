import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import {
  cn,
  fieldChromeClasses,
  fieldSizeClasses,
  type FieldChrome,
  type FieldChromeEdge,
  type FieldSize,
} from "../../utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  /** Visual size. Defaults to `sm`. Height is fixed unless `autoGrow`; use className for width. */
  size?: FieldSize;
  /** Field border treatment. Defaults to `corner`. */
  chrome?: FieldChrome;
  /** Side for `corner` / `tick`. Ignored by `underline`. Defaults to `end`. */
  chromeEdge?: FieldChromeEdge;
  /**
   * Grows with content instead of scrolling, by measuring the element's own
   * `scrollHeight` on every render (reset-to-auto-then-measure, so shrinking
   * works too) and capping it at `autoGrowMaxHeight` px, beyond which it
   * scrolls internally. Plain DOM measurement — no CSS mirror trick, so
   * there's nothing that can drift out of sync with the real content.
   */
  autoGrow?: boolean;
  /** Cap for `autoGrow`, in px. Defaults to 192 (~12rem / ~11 lines). */
  autoGrowMaxHeight?: number;
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as { current: T | null }).current = node;
    }
  };
}

// Shared by both branches so the box (padding/font) matches, autoGrow or not.
const autoGrowFieldText = "box-border px-3 py-1.5 text-xs leading-snug";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      style,
      disabled,
      rows = 1,
      size = "sm",
      chrome,
      chromeEdge,
      autoGrow = false,
      autoGrowMaxHeight = 192,
      value,
      ...props
    },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useLayoutEffect(() => {
      if (!autoGrow) return;
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto"; // drop the previous fixed height so scrollHeight reflects real content
      const next = Math.min(el.scrollHeight, autoGrowMaxHeight);
      el.style.height = `${next}px`;
      el.style.overflowY = el.scrollHeight > autoGrowMaxHeight ? "auto" : "hidden";
    });

    return (
      <textarea
        {...props}
        value={value}
        ref={autoGrow ? mergeRefs(innerRef, forwardedRef) : forwardedRef}
        rows={rows}
        disabled={disabled}
        aria-invalid={error || undefined}
        // `[data-size]` drives the global fixed-height/vertically-centered single-line
        // rule in tokens/index.css (line-height: 2.25rem) — exactly what autoGrow's
        // multi-line, variable-height box must NOT have, so it's omitted here.
        data-size={autoGrow ? undefined : size}
        data-chrome={chrome}
        data-chrome-edge={chromeEdge}
        style={{ outline: "none", boxShadow: "none", ...style }}
        className={cn(
          "min-w-0 max-w-full",
          autoGrow
            ? cn("resize-none overflow-hidden", autoGrowFieldText)
            : cn("min-h-0 resize-y", fieldSizeClasses[size]),
          fieldChromeClasses({ error, chrome, chromeEdge }),
          className
        )}
      />
    );
  }
);

Textarea.displayName = "Textarea";
