import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@erp/ui";
import type { InvoiceData, InvoiceSettings } from "./types/invoice";
import { InvoiceOptionsPanel } from "./InvoiceOptionsPanel";
import { InvoicePreview } from "./InvoicePreview";
import { LEDGER_SEAL_THEME_CSS, ledgerSealThemeVars } from "./shared/theme";

export interface InvoiceCustomizerProps {
  data: InvoiceData;
  defaultSettings: InvoiceSettings;
  /** UI-only for now — no backend to persist to yet (see the prompt's Step 6). */
  onContinue?: (settings: InvoiceSettings) => void;
  onDiscard?: () => void;
}

/**
 * Odoo-style "Configure your document layout" screen: left panel controls
 * `settings` in local state, right panel re-renders `InvoicePreview`
 * instantly on every change. Each layout already draws its own drop
 * shadow/corner decoration, so the preview needs no extra "looks like a
 * page" wrapper beyond centering it.
 */
export function InvoiceCustomizer({
  data,
  defaultSettings,
  onContinue,
  onDiscard,
}: InvoiceCustomizerProps) {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);

  function updateSetting<K extends keyof InvoiceSettings>(
    key: K,
    value: InvoiceSettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleDiscard() {
    setSettings(defaultSettings);
    onDiscard?.();
  }

  return (
    <div
      className="ls-theme flex h-screen min-h-0 bg-erp-bg print:h-auto print:block print:bg-white"
      style={ledgerSealThemeVars(settings.primaryColor, settings.secondaryColor)}
    >
      <style>{LEDGER_SEAL_THEME_CSS}</style>
      {/* Storybook's own global preview decorator adds non-print-aware
       * padding around every story; without this override the invoice would
       * print at less than one full page (same fix every other story in
       * this system needed). */}
      <style>
        {
          "@media print { #storybook-root > div { padding: 0 !important; min-height: 0 !important; } }"
        }
      </style>
      <InvoiceOptionsPanel
        settings={settings}
        defaultSettings={defaultSettings}
        onUpdate={updateSetting}
        onContinue={() => onContinue?.(settings)}
        onDiscard={handleDiscard}
      />
      <div className="relative flex flex-1 justify-center overflow-auto px-8 py-8 print:block print:overflow-visible print:p-0">
        <Button
          variant="primary"
          size="sm"
          onClick={() => window.print()}
          className="absolute right-4 top-4 print:hidden"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden /> Print
        </Button>
        <InvoicePreview data={data} settings={settings} />
      </div>
    </div>
  );
}
