import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Textarea } from "../../../primitives/Textarea";
import { cn } from "../../../utils";

export interface FormTextareaProps extends ComponentPropsWithoutRef<typeof Textarea> {
  error?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ className, ...props }, ref) {
    return <Textarea ref={ref} className={cn("w-full min-w-0", className)} {...props} />;
  }
);

FormTextarea.displayName = "FormTextarea";
