import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Input } from "../../../primitives/Input";

export interface FormInputProps extends ComponentPropsWithoutRef<typeof Input> {
  error?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(props, ref) {
    return <Input ref={ref} {...props} />;
  }
);

FormInput.displayName = "FormInput";
