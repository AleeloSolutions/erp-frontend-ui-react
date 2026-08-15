import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Textarea } from "../../../primitives/Textarea";

export interface FormTextareaProps
  extends ComponentPropsWithoutRef<typeof Textarea> {
  error?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(props, ref) {
    return <Textarea ref={ref} {...props} />;
  }
);

FormTextarea.displayName = "FormTextarea";
