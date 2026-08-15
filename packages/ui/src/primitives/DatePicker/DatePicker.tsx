import { forwardRef } from "react";
import { cn } from "../../utils";
import { Input, type InputProps } from "../Input";

export type DatePickerProps = Omit<InputProps, "type">;

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker({ className, ...props }, ref) {
    return (
      <Input
        ref={ref}
        type="date"
        className={cn("min-h-[30px]", className)}
        {...props}
      />
    );
  }
);

DatePicker.displayName = "DatePicker";
