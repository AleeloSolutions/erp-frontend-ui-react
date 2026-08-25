import { useState } from "react";
import type { InvoiceData, InvoiceSettings } from "./types/invoice";
import { InvoiceOptionsPanel } from "./InvoiceOptionsPanel";
import { InvoicePreview } from "./InvoicePreview";

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
    <div className="flex h-screen min-h-0 bg-erp-bg">
      <InvoiceOptionsPanel
        settings={settings}
        defaultSettings={defaultSettings}
        onUpdate={updateSetting}
        onContinue={() => onContinue?.(settings)}
        onDiscard={handleDiscard}
      />
      <div className="flex flex-1 justify-center overflow-auto px-8 py-8">
        <InvoicePreview data={data} settings={settings} />
      </div>
    </div>
  );
}
