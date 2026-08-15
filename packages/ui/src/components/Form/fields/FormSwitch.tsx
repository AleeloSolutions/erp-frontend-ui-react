import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Switch } from "../../../primitives/Switch";

export type FormSwitchProps = ComponentPropsWithoutRef<typeof Switch>;

export const FormSwitch = forwardRef<HTMLInputElement, FormSwitchProps>(
  function FormSwitch(props, ref) {
    return <Switch ref={ref} {...props} />;
  }
);

FormSwitch.displayName = "FormSwitch";
