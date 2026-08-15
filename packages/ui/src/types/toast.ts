export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastItem extends ToastInput {
  id: string;
  variant: ToastVariant;
  duration: number;
}
