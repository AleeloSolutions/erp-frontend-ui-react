import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "../../utils";

/** @deprecated One visual only — teal fill + halo. Kept so existing `accent` callers compile. */
export type CheckboxVariant = "default" | "accent";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  indeterminate?: boolean;
  /**
   * Table row selection uses a teal halo. Column menus and form lists
   * match Odoo (`hasHalo={false}`): teal fill + white check, no glow.
   */
  hasHalo?: boolean;
  /** Ignored — all checkboxes use the teal selected look. */
  variant?: CheckboxVariant;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      id,
      indeterminate = false,
      hasHalo = true,
      variant: _variant,
      ...props
    },
    ref
  ) => {
    const localRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (localRef.current) {
        localRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 text-[11px] text-erp-text",
          label ? "min-w-0 justify-start" : "justify-center",
          props.disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <span
          data-indeterminate={indeterminate ? "" : undefined}
          className="group/cb relative grid size-4 shrink-0 place-items-center"
        >
          <input
            ref={(node) => {
              localRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            id={id}
            type="checkbox"
            className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
            {...props}
          />
          <span
            className={cn(
              "pointer-events-none absolute inset-0 rounded-[4px] border border-erp-table-border bg-erp-table-bg",
              "peer-checked:border-erp-teal peer-checked:bg-erp-teal",
              "group-data-[indeterminate]/cb:border-erp-teal group-data-[indeterminate]/cb:bg-erp-teal",
              hasHalo &&
                "peer-checked:shadow-[0_0_0_4px_var(--teal-50)] group-data-[indeterminate]/cb:shadow-[0_0_0_4px_var(--teal-50)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-erp-teal/20"
            )}
            aria-hidden
          />
          <Check
            aria-hidden
            strokeWidth={3}
            className="pointer-events-none relative z-[1] size-2.5 text-white opacity-0 peer-checked:opacity-100 group-data-[indeterminate]/cb:opacity-0"
          />
          <Minus
            aria-hidden
            strokeWidth={3}
            className="pointer-events-none absolute z-[1] size-2.5 text-white opacity-0 group-data-[indeterminate]/cb:opacity-100"
          />
        </span>
        {label ? <span className="min-w-0 truncate">{label}</span> : null}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
