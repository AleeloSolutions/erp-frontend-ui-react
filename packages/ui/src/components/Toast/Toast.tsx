import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "../../utils";
import type { ToastInput, ToastItem, ToastVariant } from "../../types/toast";

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<
  ToastVariant,
  { className: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    className: "border-erp-success-border bg-erp-success-bg text-erp-success",
    Icon: CheckCircle2,
  },
  error: {
    className: "border-erp-error-border bg-erp-error-bg text-erp-error",
    Icon: AlertCircle,
  },
  warning: {
    className: "border-erp-warning-border bg-erp-warning-bg text-erp-warning",
    Icon: AlertTriangle,
  },
  info: {
    className: "border-erp-info-border bg-erp-info-bg text-erp-info",
    Icon: Info,
  },
};

function createId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = createId();
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "info",
        duration: input.duration ?? 3500,
      };

      setToasts((current) => [...current, item]);

      if (item.duration > 0) {
        window.setTimeout(() => dismiss(id), item.duration);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-3 bottom-3 z-[200] flex w-[min(360px,calc(100vw-1.5rem))] flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((item) => {
          const { Icon, className } = variantStyles[item.variant];
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2 shadow-lg",
                className
              )}
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[12px] font-bold text-erp-text">{item.title}</p>
                {item.description ? (
                  <p className="m-0 mt-0.5 text-[11px] text-erp-muted">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 text-erp-muted hover:bg-black/5 hover:text-erp-text"
                onClick={() => dismiss(item.id)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
