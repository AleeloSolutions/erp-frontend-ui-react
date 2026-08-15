import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Radio } from "../../../primitives/Radio";

export type FormRadioProps = ComponentPropsWithoutRef<typeof Radio>;

export const FormRadio = forwardRef<HTMLInputElement, FormRadioProps>(
  function FormRadio(props, ref) {
    return <Radio ref={ref} {...props} />;
  }
);

FormRadio.displayName = "FormRadio";
