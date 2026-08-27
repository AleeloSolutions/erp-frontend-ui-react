import { useState, type ReactNode } from "react";
import { Button, FormFileUpload, Input, Select, Switch, Textarea, cn } from "@erp/ui";
import type { InvoiceSettings, LayoutKey, TableStyleKey } from "./types/invoice";
import { invoiceLayouts } from "./config/invoiceLayouts";
import { tableStyles } from "./config/tableStyles";
import { FRAUNCES, JETBRAINS_MONO } from "./shared/theme";

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

/** "Kaabe Studio" panel chrome (see the Ledger Seal reference's `.panel h2`). */
function SectionLabel({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <div
      className={cn(
        "text-[10.5px] font-semibold uppercase tracking-[.08em]",
        first ? "mb-2.5 mt-0" : "mb-2.5 mt-5"
      )}
      style={{ color: "var(--ls-ink-soft)" }}
    >
      {children}
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
      className="flex w-16 flex-col items-center gap-1 rounded-[7px] border-2 p-1.5 transition-colors"
      style={{ borderColor: active ? "var(--ls-primary)" : "transparent" }}
    >
      <span
        className="grid h-14 w-full place-items-center overflow-hidden rounded-[5px] border bg-white"
        style={{ borderColor: "#e2dcd3" }}
      >
        {children}
      </span>
      <span className="text-[10px] font-medium" style={{ color: "var(--ls-ink)" }}>
        {label}
      </span>
    </button>
  );
}

/** Small structural hints, not real thumbnail images — no asset files exist for these yet (doc's `thumbnail` field is a placeholder path). */
function LayoutArt({ layoutKey }: { layoutKey: LayoutKey }) {
  if (layoutKey === "center") {
    return (
      <span className="flex h-full w-full flex-col">
        <span
          className="h-2.5 w-full"
          style={{ backgroundColor: "var(--ls-primary-10)" }}
        />
        <span
          className="mx-auto mt-1.5 h-1 w-6 rounded-full"
          style={{ backgroundColor: "var(--ls-primary)" }}
        />
      </span>
    );
  }
  if (layoutKey === "bubble") {
    return (
      <span className="relative block h-full w-full overflow-hidden">
        <span
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
          style={{ backgroundColor: "var(--ls-primary-10)" }}
        />
        <span
          className="absolute -bottom-3 -left-3 h-2 w-2 rounded-[2px]"
          style={{ backgroundColor: "var(--ls-secondary)" }}
        />
      </span>
    );
  }
  return (
    <span className="relative flex h-full w-full">
      <span className="w-1.5 shrink-0" style={{ backgroundColor: "var(--ls-primary)" }} />
      <span className="flex-1 p-1">
        <span
          className="grid h-3 w-3 rotate-45 place-items-center"
          style={{ backgroundColor: "var(--ls-secondary)" }}
        />
      </span>
    </span>
  );
}

function TableArt({ tableKey }: { tableKey: TableStyleKey }) {
  if (tableKey === "striped") {
    return (
      <span className="flex h-full w-full flex-col justify-center gap-[3px] px-1">
        <span
          className="h-1.5 w-full"
          style={{ backgroundColor: "var(--ls-primary-10)" }}
        />
        <span className="h-1.5 w-full" />
        <span
          className="h-1.5 w-full"
          style={{ backgroundColor: "var(--ls-primary-10)" }}
        />
      </span>
    );
  }
  if (tableKey === "bordered") {
    return (
      <span
        className="grid h-8 w-8 grid-cols-2 grid-rows-2 border"
        style={{ borderColor: "#e2dcd3" }}
      >
        <span className="border-b border-r" style={{ borderColor: "#e2dcd3" }} />
        <span className="border-b" style={{ borderColor: "#e2dcd3" }} />
        <span className="border-r" style={{ borderColor: "#e2dcd3" }} />
        <span />
      </span>
    );
  }
  return (
    <span className="flex h-full w-full flex-col justify-center gap-[5px] px-1">
      <span className="h-px w-full" style={{ backgroundColor: "#e2dcd3" }} />
      <span className="h-px w-full" style={{ backgroundColor: "#e2dcd3" }} />
      <span className="h-px w-full" style={{ backgroundColor: "#e2dcd3" }} />
    </span>
  );
}

const COLOR_PRESETS: Array<[string, string]> = [
  ["#5C3120", "#E8912A"],
  ["#1B62B5", "#0E7C72"],
  ["#0F5132", "#C9A227"],
  ["#7A1F2B", "#D98A3D"],
  ["#153B4F", "#3AA0A0"],
  ["#2B2420", "#B08968"],
];

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
    <div
      className="flex h-full w-[300px] shrink-0 flex-col border-r bg-white print:hidden"
      style={{ borderColor: "var(--ls-line)" }}
    >
      <div className="flex-1 overflow-y-auto px-[22px] py-6">
        <div
          className="text-[15px] font-semibold"
          style={{ fontFamily: FRAUNCES, color: "var(--ls-ink)" }}
        >
          Document Layout
        </div>
        <p
          className="mt-0.5 text-[11.5px] leading-relaxed"
          style={{ color: "var(--ls-ink-soft)" }}
        >
          Change anything below and the preview updates live.
        </p>

        <SectionLabel first>Layout</SectionLabel>
        <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-wrap gap-2">
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
        <Select
          options={fontOptions}
          value={settings.font}
          onChange={(e) => onUpdate("font", e.target.value)}
        />

        <SectionLabel>Brand colors</SectionLabel>
        <div className="flex items-center gap-3">
          <label className="w-[62px] text-[12.5px]" style={{ color: "var(--ls-ink)" }}>
            Primary
          </label>
          <Input
            type="color"
            value={settings.primaryColor}
            onChange={(e) => onUpdate("primaryColor", e.target.value)}
            className="h-8 w-9 cursor-pointer rounded-[7px] p-0.5"
          />
          <span
            className="text-[11px] uppercase"
            style={{ fontFamily: JETBRAINS_MONO, color: "var(--ls-ink-soft)" }}
          >
            {settings.primaryColor}
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <label className="w-[62px] text-[12.5px]" style={{ color: "var(--ls-ink)" }}>
            Secondary
          </label>
          <Input
            type="color"
            value={settings.secondaryColor}
            onChange={(e) => onUpdate("secondaryColor", e.target.value)}
            className="h-8 w-9 cursor-pointer rounded-[7px] p-0.5"
          />
          <span
            className="text-[11px] uppercase"
            style={{ fontFamily: JETBRAINS_MONO, color: "var(--ls-ink-soft)" }}
          >
            {settings.secondaryColor}
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map(([p, s]) => {
            const isSelected =
              settings.primaryColor === p && settings.secondaryColor === s;
            return (
              <button
                key={p + s}
                type="button"
                title={`${p} / ${s}`}
                onClick={() => {
                  onUpdate("primaryColor", p);
                  onUpdate("secondaryColor", s);
                }}
                className="h-[22px] w-[22px] rounded-[6px] border-2 transition-transform hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${p} 50%, ${s} 50%)`,
                  borderColor: isSelected ? "var(--ls-ink)" : "transparent",
                }}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={resetColors}
          className="mt-2 inline-block cursor-pointer text-[11.5px] underline"
          style={{ color: "var(--ls-ink-soft)" }}
        >
          Reset colors
        </button>

        <SectionLabel>Logo</SectionLabel>
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border bg-white"
            style={{ borderColor: "var(--ls-line)" }}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-[9px]" style={{ color: "var(--ls-ink-soft)" }}>
                No logo
              </span>
            )}
          </div>
          <FormFileUpload
            accept="image/*"
            onFilesChange={handleLogoFiles}
            hint="Upload logo"
          />
        </div>

        <SectionLabel>Address</SectionLabel>
        <Textarea
          autoGrow
          value={settings.address ?? ""}
          onChange={(e) => onUpdate("address", e.target.value)}
          placeholder="Shown in the document header — supports multiple lines"
        />

        <SectionLabel>Company Name</SectionLabel>
        <Input
          value={settings.tagline ?? ""}
          onChange={(e) => onUpdate("tagline", e.target.value)}
          placeholder="Replaces your company name when set"
          style={{ color: "var(--ls-ink-soft)" }}
        />

        <SectionLabel>Footer</SectionLabel>
        <Input
          value={settings.footerText ?? ""}
          onChange={(e) => onUpdate("footerText", e.target.value)}
          placeholder="Shown at the bottom of every page"
        />

        <SectionLabel>Paper format</SectionLabel>
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

        <SectionLabel>Tax ID</SectionLabel>
        <Input
          value={settings.taxId ?? ""}
          onChange={(e) => onUpdate("taxId", e.target.value)}
          placeholder="Your company's tax identification number"
        />

        <SectionLabel>Bank account</SectionLabel>
        <Input
          value={settings.bankAccount ?? ""}
          onChange={(e) => onUpdate("bankAccount", e.target.value)}
          placeholder="Default account for payment instructions"
        />

        <div className="mt-5">
          <Switch
            label="Show QR code"
            checked={settings.showQrCode}
            onChange={(e) => onUpdate("showQrCode", e.target.checked)}
          />
        </div>
      </div>

      <div
        className="flex gap-2 border-t px-[22px] py-3"
        style={{ borderColor: "var(--ls-line)" }}
      >
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
