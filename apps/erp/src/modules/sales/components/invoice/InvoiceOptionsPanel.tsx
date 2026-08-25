import { useState, type ReactNode } from "react";
import { Info, RotateCcw } from "lucide-react";
import {
  Button,
  FormFileUpload,
  Input,
  Select,
  Switch,
  Textarea,
  Tooltip,
  cn,
} from "@erp/ui";
import type { InvoiceSettings, LayoutKey, TableStyleKey } from "./types/invoice";
import { invoiceLayouts } from "./config/invoiceLayouts";
import { tableStyles } from "./config/tableStyles";

export interface InvoiceOptionsPanelProps {
  settings: InvoiceSettings;
  defaultSettings: InvoiceSettings;
  onUpdate: <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => void;
  onContinue: () => void;
  onDiscard: () => void;
}

const fontOptions = [
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-erp-muted">
      {children}
    </div>
  );
}

function FieldLabel({ text, hint }: { text: string; hint: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1">
      <span className="text-[12px] font-medium text-erp-text">{text}</span>
      <Tooltip content={hint} side="top">
        <Info className="h-3 w-3 text-erp-muted" aria-hidden />
      </Tooltip>
    </div>
  );
}

function ThumbnailButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-16 flex-col items-center gap-1 rounded-[6px] border-2 p-1.5 transition-colors",
        active
          ? "border-erp-primary"
          : "border-transparent hover:border-erp-border-strong"
      )}
    >
      <span className="grid h-14 w-full place-items-center overflow-hidden rounded-[3px] border border-erp-border bg-white">
        {children}
      </span>
      <span className="text-[10px] font-medium text-erp-text">{label}</span>
    </button>
  );
}

/** Small structural hints, not real thumbnail images — no asset files exist for these yet (doc's `thumbnail` field is a placeholder path). */
function LayoutArt({ layoutKey }: { layoutKey: LayoutKey }) {
  if (layoutKey === "center") {
    return (
      <span className="flex h-full w-full flex-col">
        <span className="h-2.5 w-full bg-erp-header" />
        <span className="mx-auto mt-1.5 h-1 w-6 rounded-full bg-erp-primary" />
      </span>
    );
  }
  if (layoutKey === "bubble") {
    return (
      <span className="relative block h-full w-full overflow-hidden">
        <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-erp-header" />
      </span>
    );
  }
  return (
    <span className="relative block h-full w-full overflow-hidden">
      <span className="absolute -left-3 -top-4 h-7 w-[130%] -rotate-6 bg-erp-header" />
    </span>
  );
}

function TableArt({ tableKey }: { tableKey: TableStyleKey }) {
  if (tableKey === "striped") {
    return (
      <span className="flex h-full w-full flex-col justify-center gap-[3px] px-1">
        <span className="h-1.5 w-full bg-erp-header" />
        <span className="h-1.5 w-full" />
        <span className="h-1.5 w-full bg-erp-header" />
      </span>
    );
  }
  if (tableKey === "bordered") {
    return (
      <span className="grid h-8 w-8 grid-cols-2 grid-rows-2 border border-erp-border">
        <span className="border-b border-r border-erp-border" />
        <span className="border-b border-erp-border" />
        <span className="border-r border-erp-border" />
        <span />
      </span>
    );
  }
  return (
    <span className="flex h-full w-full flex-col justify-center gap-[5px] px-1">
      <span className="h-px w-full bg-erp-border" />
      <span className="h-px w-full bg-erp-border" />
      <span className="h-px w-full bg-erp-border" />
    </span>
  );
}

export function InvoiceOptionsPanel({
  settings,
  defaultSettings,
  onUpdate,
  onContinue,
  onDiscard,
}: InvoiceOptionsPanelProps) {
  const [logoPreview, setLogoPreview] = useState<string | undefined>(settings.logoUrl);

  function handleLogoFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    onUpdate("logoUrl", objectUrl);
  }

  function resetColors() {
    onUpdate("primaryColor", defaultSettings.primaryColor);
    onUpdate("secondaryColor", defaultSettings.secondaryColor);
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-erp-border bg-erp-surface">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <SectionLabel>Layout</SectionLabel>
        <div className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(invoiceLayouts) as LayoutKey[]).map((key) => (
            <ThumbnailButton
              key={key}
              label={invoiceLayouts[key].label}
              active={settings.layout === key}
              onClick={() => onUpdate("layout", key)}
            >
              <LayoutArt layoutKey={key} />
            </ThumbnailButton>
          ))}
        </div>

        <SectionLabel>Tables</SectionLabel>
        <div className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(tableStyles) as TableStyleKey[]).map((key) => (
            <ThumbnailButton
              key={key}
              label={tableStyles[key].label}
              active={settings.tableStyle === key}
              onClick={() => onUpdate("tableStyle", key)}
            >
              <TableArt tableKey={key} />
            </ThumbnailButton>
          ))}
        </div>

        <SectionLabel>Text</SectionLabel>
        <div className="mb-5">
          <Select
            options={fontOptions}
            value={settings.font}
            onChange={(e) => onUpdate("font", e.target.value)}
          />
        </div>

        <SectionLabel>Logo</SectionLabel>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-erp-border bg-white">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-[9px] text-erp-muted">No logo</span>
            )}
          </div>
          <FormFileUpload
            accept="image/*"
            onFilesChange={handleLogoFiles}
            hint="Upload logo"
          />
        </div>

        <SectionLabel>Colors</SectionLabel>
        <div className="mb-5 flex items-end gap-3">
          <div>
            <div className="mb-1 text-[10px] text-erp-muted">Primary</div>
            <Input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => onUpdate("primaryColor", e.target.value)}
              className="h-8 w-14 cursor-pointer p-1"
            />
          </div>
          <div>
            <div className="mb-1 text-[10px] text-erp-muted">Secondary</div>
            <Input
              type="color"
              value={settings.secondaryColor}
              onChange={(e) => onUpdate("secondaryColor", e.target.value)}
              className="h-8 w-14 cursor-pointer p-1"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={resetColors}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
          </Button>
        </div>

        <div className="mb-5">
          <FieldLabel
            text="Address"
            hint="Shown in the document header. Supports multiple lines."
          />
          <Textarea
            autoGrow
            value={settings.address ?? ""}
            onChange={(e) => onUpdate("address", e.target.value)}
          />
        </div>

        <div className="mb-5">
          <FieldLabel
            text="Tagline"
            hint="Replaces your company name on the document when set."
          />
          <Input
            value={settings.tagline ?? ""}
            onChange={(e) => onUpdate("tagline", e.target.value)}
          />
        </div>

        <div className="mb-5">
          <FieldLabel text="Footer" hint="Text shown at the bottom of every page." />
          <Input
            value={settings.footerText ?? ""}
            onChange={(e) => onUpdate("footerText", e.target.value)}
          />
        </div>

        <div className="mb-5">
          <div className="mb-1.5 text-[12px] font-medium text-erp-text">Paper format</div>
          <Select
            options={[
              { label: "A4", value: "A4" },
              { label: "Letter", value: "Letter" },
            ]}
            value={settings.paperFormat}
            onChange={(e) =>
              onUpdate("paperFormat", e.target.value as InvoiceSettings["paperFormat"])
            }
          />
        </div>

        <div className="mb-5">
          <FieldLabel text="Tax ID" hint="Your company's tax identification number." />
          <Input
            value={settings.taxId ?? ""}
            onChange={(e) => onUpdate("taxId", e.target.value)}
          />
        </div>

        <div className="mb-5">
          <FieldLabel
            text="Bank Account"
            hint="Default account shown for payment instructions."
          />
          <Input
            value={settings.bankAccount ?? ""}
            onChange={(e) => onUpdate("bankAccount", e.target.value)}
          />
        </div>

        <div className="mb-2">
          <Switch
            label="Show QR code"
            checked={settings.showQrCode}
            onChange={(e) => onUpdate("showQrCode", e.target.checked)}
          />
        </div>
      </div>

      <div className="flex gap-2 border-t border-erp-border px-4 py-3">
        <Button variant="primary" size="sm" onClick={onContinue} className="flex-1">
          Continue
        </Button>
        <Button variant="secondary" size="sm" onClick={onDiscard} className="flex-1">
          Discard
        </Button>
      </div>
    </div>
  );
}
