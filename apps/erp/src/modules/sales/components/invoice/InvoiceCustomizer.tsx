import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Printer } from "lucide-react";
import { Button, cn } from "@erp/ui";
import type { InvoiceData, InvoiceSettings } from "./types/invoice";
import { InvoiceOptionsPanel } from "./InvoiceOptionsPanel";
import { InvoicePreview } from "./InvoicePreview";
import { LEDGER_SEAL_THEME_CSS, ledgerSealThemeVars } from "./shared/theme";

/** Approximate A4 width at 96dpi — used to scale preview in modal. */
const A4_WIDTH_PX = 794;
const MODAL_PREVIEW_MAX_SCALE = 0.65;
const MODAL_PREVIEW_MIN_SCALE = 0.32;

export interface InvoiceCustomizerProps {
  data: InvoiceData;
  defaultSettings: InvoiceSettings;
  /** UI-only for now — no backend to persist to yet (see the prompt's Step 6). */
  onContinue?: (settings: InvoiceSettings) => void;
  onDiscard?: () => void;
  /** `page` — full viewport (Storybook/default). `modal` — fits inside dialog. */
  mode?: "page" | "modal";
  /** @deprecated Use `mode="modal"` instead. */
  embedded?: boolean;
  /** Preview scale when `embedded` (ignored when `mode="modal"` — auto-fit). */
  embeddedPreviewScale?: number;
}

export interface InvoiceCustomizerHandle {
  continue: () => void;
  discard: () => void;
}

function useFitPreviewScale(
  containerRef: React.RefObject<HTMLElement | null>,
  enabled: boolean
) {
  const [scale, setScale] = useState(0.55);

  useLayoutEffect(() => {
    if (!enabled) return;
    const element = containerRef.current;
    if (!element) return;

    function updateScale() {
      const pad = 32;
      const availW = Math.max(element!.clientWidth - pad, 120);
      const widthScale = availW / A4_WIDTH_PX;
      setScale(
        Math.max(MODAL_PREVIEW_MIN_SCALE, Math.min(widthScale, MODAL_PREVIEW_MAX_SCALE))
      );
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, enabled]);

  return scale;
}

/**
 * Odoo-style "Configure your document layout" screen: left panel controls
 * `settings` in local state, right panel re-renders `InvoicePreview`
 * instantly on every change. Each layout already draws its own drop
 * shadow/corner decoration, so the preview needs no extra "looks like a
 * page" wrapper beyond centering it.
 */
export const InvoiceCustomizer = forwardRef<
  InvoiceCustomizerHandle,
  InvoiceCustomizerProps
>(function InvoiceCustomizer(
  {
    data,
    defaultSettings,
    onContinue,
    onDiscard,
    mode: modeProp,
    embedded = false,
    embeddedPreviewScale = 0.72,
  },
  ref
) {
  const mode = modeProp ?? (embedded ? "modal" : "page");
  const isModal = mode === "modal";

  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fitScale = useFitPreviewScale(previewContainerRef, isModal);
  const previewScale = isModal ? fitScale : embeddedPreviewScale;

  function updateSetting<K extends keyof InvoiceSettings>(
    key: K,
    value: InvoiceSettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleContinue() {
    onContinue?.(settings);
  }

  function handleDiscard() {
    setSettings(defaultSettings);
    onDiscard?.();
  }

  useImperativeHandle(ref, () => ({
    continue: handleContinue,
    discard: handleDiscard,
  }));

  return (
    <div
      className={cn(
        "ls-theme bg-erp-bg print:h-auto print:block print:bg-white",
        isModal
          ? "h-full min-h-0 overflow-y-auto [scrollbar-width:thin]"
          : "flex h-screen min-h-0"
      )}
      style={ledgerSealThemeVars(settings.primaryColor, settings.secondaryColor)}
    >
      <style>{LEDGER_SEAL_THEME_CSS}</style>
      <style>
        {
          "@media print { #storybook-root > div { padding: 0 !important; min-height: 0 !important; } }"
        }
      </style>
      <div
        className={cn(
          isModal ? "flex min-h-min items-start" : "flex h-full min-h-0 flex-1"
        )}
      >
        <InvoiceOptionsPanel
          settings={settings}
          defaultSettings={defaultSettings}
          onUpdate={updateSetting}
          onContinue={handleContinue}
          onDiscard={handleDiscard}
          showHeader={!isModal}
          showActions={!isModal}
          scrollable={!isModal}
          className={isModal ? "w-[min(380px,38%)] min-w-[280px]" : undefined}
        />
        <div
          ref={previewContainerRef}
          className={cn(
            "relative flex print:block print:overflow-visible print:p-0",
            isModal
              ? "min-h-min flex-1 items-start justify-center bg-erp-bg px-6 py-6"
              : "min-h-0 flex-1 items-start justify-center overflow-auto px-8 pt-16"
          )}
        >
          {!isModal ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              className="absolute right-4 top-4 z-10 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden /> Print
            </Button>
          ) : null}
          {isModal || embedded ? (
            <div
              className="relative mx-auto shrink-0"
              style={{
                width: `calc(210mm * ${previewScale})`,
                height: `calc(297mm * ${previewScale})`,
              }}
            >
              <div
                className="absolute left-0 top-0 origin-top-left print:relative print:scale-100"
                style={{
                  transform: `scale(${previewScale})`,
                  width: "210mm",
                }}
              >
                <InvoicePreview data={data} settings={settings} />
              </div>
            </div>
          ) : (
            <InvoicePreview data={data} settings={settings} />
          )}
        </div>
      </div>
    </div>
  );
});

InvoiceCustomizer.displayName = "InvoiceCustomizer";
