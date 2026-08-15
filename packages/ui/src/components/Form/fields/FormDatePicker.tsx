import { forwardRef } from "react";
import {
  DatePicker,
  type DatePickerProps,
} from "../../../primitives/DatePicker";

export type FormDatePickerProps = Omit<DatePickerProps, "min" | "max"> & {
  /** Widened for RHF `register()` (min/max may be number | string). */
  min?: string | number;
  max?: string | number;
};

export const FormDatePicker = forwardRef<HTMLInputElement, FormDatePickerProps>(
  function FormDatePicker(props, ref) {
    return <DatePicker ref={ref} {...props} />;
  }
);

FormDatePicker.displayName = "FormDatePicker";
