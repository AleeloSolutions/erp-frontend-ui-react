import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Input } from "../../../primitives/Input";
import { cn } from "../../../utils";

export interface FormInputProps extends ComponentPropsWithoutRef<typeof Input> {
  error?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  { className, ...props },
  ref
) {
  return <Input ref={ref} className={cn("w-full min-w-0", className)} {...props} />;
});

FormInput.displayName = "FormInput";
