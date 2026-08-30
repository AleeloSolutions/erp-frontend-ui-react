import { ArrowLeft } from "lucide-react";

export interface SettingsDetailBackProps {
  onBack: () => void;
  label?: string;
}

export function SettingsDetailBack({
  onBack,
  label = "Back to overview",
}: SettingsDetailBackProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm text-erp-brand-third hover:underline"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}
