import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Select } from "../../../primitives/Select";
import { cn } from "../../../utils";

export interface FormSelectProps extends ComponentPropsWithoutRef<typeof Select> {
  error?: boolean;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect({ className, ...props }, ref) {
    return <Select ref={ref} className={cn("w-full min-w-0", className)} {...props} />;
  }
);

FormSelect.displayName = "FormSelect";
