import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Select } from "../../../primitives/Select";

export interface FormSelectProps
  extends ComponentPropsWithoutRef<typeof Select> {
  error?: boolean;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(props, ref) {
    return <Select ref={ref} {...props} />;
  }
);

FormSelect.displayName = "FormSelect";
