import type { SampleModule } from "../settingsModules";

export interface SettingsComingSoonPanelProps {
  module: SampleModule;
}

/**
 * What a module that does not exist yet shows.
 *
 * Deliberately inert: there is nothing to configure, so there is nothing
 * to click. A greyed-out Save button here would be a control that looks
 * interactive and is not (design rule 3) — the empty state says so in
 * words instead.
 */
export function SettingsComingSoonPanel({ module }: SettingsComingSoonPanelProps) {
  const Icon = module.icon;

  return (
    <div
      className="flex min-h-[22rem] items-center justify-center rounded-sm border border-erp-border-soft bg-white px-6 py-16"
      role="tabpanel"
      aria-label={`${module.label} settings`}
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <span
          className="grid h-14 w-14 place-items-center rounded-full bg-erp-surface-muted text-erp-subtle"
          aria-hidden
        >
          <Icon className="h-6 w-6" />
        </span>

        <h2 className="mt-5 mb-0 text-[15px] font-semibold text-erp-text">
          {module.label}
        </h2>

        <p className="mt-1.5 mb-0 text-[13px] font-medium text-erp-primary">
          Coming soon
        </p>

        <p className="mt-3 mb-0 text-[13px] leading-relaxed text-erp-muted">
          This module is not part of your workspace yet. When it ships, its settings will
          appear here.
        </p>
      </div>
    </div>
  );
}
