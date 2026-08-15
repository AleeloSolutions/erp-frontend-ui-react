import type { ReactNode } from "react";

export type FormFieldSpan = 4 | 6 | 8 | 12 | number;

export interface FormSummaryItem {
  key: string;
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}

export interface FormStepperStep {
  key?: string;
  label: string;
}

export interface FormServerError {
  message: string;
  details?: string[];
}
