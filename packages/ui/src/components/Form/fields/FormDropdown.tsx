import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Dropdown } from "../../Dropdown";
import { cn } from "../../../utils";

export type FormDropdownProps = Omit<
  ComponentPropsWithoutRef<typeof Dropdown>,
  "trigger"
>;

export const FormDropdown = forwardRef<HTMLInputElement, FormDropdownProps>(
  function FormDropdown({ className, ...props }, ref) {
    return (
      <Dropdown
        ref={ref}
        trigger="field"
        className={cn("w-full min-w-0", className)}
        {...props}
      />
    );
  }
);

FormDropdown.displayName = "FormDropdown";
