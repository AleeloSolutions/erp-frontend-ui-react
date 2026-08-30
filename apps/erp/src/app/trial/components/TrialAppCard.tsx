import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, cn } from "@erp/ui";
import type { TrialApp } from "../trialApps";
import { AppMark } from "@/app/landing/components/AppMark";

export interface TrialAppCardProps {
  app: TrialApp;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function TrialAppCard({ app, selected, onToggle }: TrialAppCardProps) {
  const { t } = useTranslation("trial");
  const inputId = `trial-app-${app.id}`;

  return (
    <div className="h-full ps-0">
      <input
        type="checkbox"
        className="sr-only"
        id={inputId}
        checked={selected}
        onChange={() => onToggle(app.id)}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "trial-app-card flex h-full cursor-pointer items-center rounded-[var(--radius-sm)] p-3 transition-[border-color,box-shadow]",
          selected && "is-selected"
        )}
      >
        {selected ? (
          <span className="trial-app-check" aria-hidden="true">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : null}
        <span className="trial-app-mark me-3">
          <AppMark kind={app.kind} />
        </span>
        <span className="text-base font-bold leading-tight text-erp-text">
          {t(app.labelKey)}
        </span>
      </label>
    </div>
  );
}

export interface TrialSidebarProps {
  selectedApps: TrialApp[];
  onRemove: (id: string) => void;
  onContinue: () => void;
}

export function TrialSidebar({ selectedApps, onRemove, onContinue }: TrialSidebarProps) {
  const { t } = useTranslation("trial");
  const count = selectedApps.length;

  return (
    <div className="trial-sidebar-panel">
      <h3 className="mb-4 text-lg font-bold text-erp-text">
        <strong>{count}</strong> {count === 1 ? t("sidebar.app") : t("sidebar.apps")}{" "}
        {t("sidebar.selected")}
      </h3>

      {count > 0 ? (
        <ul className="mb-4 list-none space-y-3 p-0">
          {selectedApps.map((app) => (
            <li
              key={app.id}
              className="flex items-center gap-2 text-sm font-semibold text-erp-text"
            >
              <span className="trial-app-mark">
                <AppMark kind={app.kind} />
              </span>
              <span className="min-w-0 flex-1 truncate">{t(app.labelKey)}</span>
              <button
                type="button"
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-erp-muted hover:bg-erp-menu-hover hover:text-erp-text"
                aria-label={`Remove ${t(app.labelKey)}`}
                onClick={() => onRemove(app.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="trial-sidebar-promo mb-4">{t("sidebar.promo")}</div>

      <Button
        variant="primary"
        size="lg"
        className="w-full justify-center py-3 text-base font-bold"
        onClick={onContinue}
      >
        {t("sidebar.continue")}
      </Button>
    </div>
  );
}
