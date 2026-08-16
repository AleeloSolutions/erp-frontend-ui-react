import { forwardRef } from "react";
import { DatePicker, type DatePickerProps } from "../../../primitives/DatePicker";
import { cn } from "../../../utils";

export type FormDatePickerProps = Omit<DatePickerProps, "min" | "max"> & {
  /** Widened for RHF `register()` (min/max may be number | string). */
  min?: string | number;
  max?: string | number;
};

export const FormDatePicker = forwardRef<HTMLInputElement, FormDatePickerProps>(
  function FormDatePicker({ min, max, className, ...props }, ref) {
    return (
      <DatePicker
        ref={ref}
        className={cn("w-full min-w-0", className)}
        min={min != null ? String(min) : undefined}
        max={max != null ? String(max) : undefined}
        {...props}
      />
    );
  }
);

FormDatePicker.displayName = "FormDatePicker";
