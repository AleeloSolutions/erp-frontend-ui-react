import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Checkbox } from "../../../primitives/Checkbox";

export type FormCheckboxProps = ComponentPropsWithoutRef<typeof Checkbox>;

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  function FormCheckbox(props, ref) {
    return <Checkbox ref={ref} {...props} />;
  }
);

FormCheckbox.displayName = "FormCheckbox";
