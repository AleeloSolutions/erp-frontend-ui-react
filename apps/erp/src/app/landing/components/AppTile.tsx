import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LandingApp } from "../landingApps";
import { AppMark } from "./AppMark";

export interface AppTileProps {
  app: LandingApp;
}

export function AppTile({ app }: AppTileProps) {
  const { t } = useTranslation("landing");

  return (
    <Link
      className="flex flex-col items-center gap-[1.0625rem] text-[0.9375rem] font-semibold text-erp-text no-underline transition-[transform,color] hover:-translate-y-1 hover:text-nav max-[420px]:gap-[0.6875rem] max-[420px]:text-xs"
      to={app.to}
    >
      <span className="grid h-[5.625rem] w-[5.625rem] place-items-center rounded-[var(--radius-sm)] bg-erp-table-bg shadow-md max-[800px]:h-[4.625rem] max-[800px]:w-[4.625rem] max-[420px]:h-[4.0625rem] max-[420px]:w-[4.0625rem]">
        <AppMark kind={app.kind} />
      </span>
      <span>{t(app.labelKey)}</span>
    </Link>
  );
}
