import { SettingsSection } from "./SettingsSection";

export interface SettingsStubPanelProps {
  title: string;
  description?: string;
}

/** Placeholder content for Settings modules that are not wired yet. */
export function SettingsStubPanel({
  title,
  description = "Configuration for this area will appear here in a later release.",
}: SettingsStubPanelProps) {
  return (
    <div
      className="overflow-hidden rounded-sm border border-erp-border-soft bg-white"
      role="tabpanel"
    >
      <SettingsSection title={title}>
        <p className="col-span-full text-sm text-erp-muted">{description}</p>
      </SettingsSection>
    </div>
  );
}
