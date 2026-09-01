import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@erp/ui";
import { LANDING_APPS, LANDING_NAV } from "./landingApps";
import { AppTile } from "./components/AppTile";
import "./landing.css";

const SIGN_IN = "/login";
const TRIAL = "/trial";

const primaryCta = cn(
  "inline-flex items-center justify-center rounded-[var(--radius-md)] border border-btn-hover",
  "bg-btn-hover px-7 py-4 text-[0.875rem] font-bold text-erp-primary-foreground shadow-md",
  "transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:bg-nav hover:border-nav",
  "active:border-nav-active active:bg-nav-active"
);

const secondaryCta = cn(
  "inline-flex items-center justify-center rounded-[var(--radius-md)] border border-erp-secondary-border",
  "bg-erp-secondary px-7 py-4 text-[0.875rem] font-bold text-erp-secondary-foreground",
  "transition-colors hover:bg-erp-secondary-hover"
);

const headerCta = cn(primaryCta, "px-5 py-3 text-[0.875rem]");

/**
 * Public marketing landing for the ERP platform. Renders outside `AppShell` —
 * same pattern as a pre-auth entry page mounted from `routes.tsx`.
 */
export default function LandingPage() {
  const { t } = useTranslation("landing");
  const [showcase, setShowcase] = useState(true);

  return (
    <main className="min-h-screen overflow-hidden bg-erp-table-bg text-erp-text">
      <header className="mx-auto flex h-[4.875rem] max-w-[1230px] items-center justify-between gap-[1.875rem] px-7">
        <Link
          className="text-[1.9375rem] font-bold leading-none tracking-[-0.1875rem] text-erp-subtle no-underline"
          to="/"
          aria-label={t("logoAria")}
        >
          <span className="text-nav">e</span>rp
        </Link>
        <nav
          className="hidden flex-1 justify-center gap-11 text-[0.9375rem] font-semibold min-[801px]:flex"
          aria-label="Main navigation"
        >
          {LANDING_NAV.map((item) => (
            <a
              key={item.href}
              className="text-erp-text no-underline transition-colors hover:text-nav"
              href={item.href}
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-[1.625rem] text-[0.9375rem] font-semibold">
          <Link
            className="text-erp-text no-underline transition-colors hover:text-nav"
            to={SIGN_IN}
          >
            {t("signIn")}
          </Link>
          <Link className={headerCta} to={TRIAL}>
            {t("getStarted")}
          </Link>
        </div>
      </header>

      <section
        className="relative px-5 pb-[6.8125rem] pt-[3.8125rem] text-center"
        id="top"
      >
        <div className="mb-[1.4375rem] text-[0.6875rem] font-bold uppercase tracking-[0.1375rem] text-nav">
          {t("hero.eyebrow")}
        </div>
        <h1 className="landing-hero-title mx-auto max-w-[920px] text-[4.75rem] font-bold leading-[1.05] tracking-[-0.125rem]">
          {t("hero.titleBefore")} <em>{t("hero.titleEmphasis")}</em>
        </h1>
        <p className="landing-hero-subtitle mx-auto mb-12 mt-[1.375rem] max-w-[920px] text-[2.8125rem] font-bold leading-[1.1]">
          {t("hero.subtitle")}
        </p>
        <div className="flex justify-center gap-[1.125rem]" id="start">
          <Link className={primaryCta} to={TRIAL}>
            {t("hero.startCta")}
          </Link>
          <a className={secondaryCta} href="#apps">
            {t("hero.exploreCta")}
          </a>
        </div>
        <div className="landing-hero-note absolute bottom-[3.625rem] end-[12%] text-start text-[1.375rem] font-bold leading-[1.15] text-nav max-[800px]:static max-[800px]:mx-auto max-[800px]:mt-[2.125rem] max-[800px]:w-max">
          <span className="landing-note-line" />
          {t("hero.noteLine")}
          <br />
          <strong className="ms-[2.375rem]">{t("hero.noteStrong")}</strong>
        </div>
      </section>

      <section
        className={cn(
          "landing-showcase relative -mt-[1.375rem] bg-erp-bg px-6 pb-[5.125rem] pt-[4.375rem]",
          !showcase && "is-collapsed"
        )}
        id="apps"
      >
        <div className="landing-app-grid mx-auto grid max-w-[930px] grid-cols-3 gap-x-3 gap-y-[1.875rem] min-[801px]:grid-cols-6 min-[801px]:gap-x-10 min-[801px]:gap-y-[2.375rem]">
          {LANDING_APPS.map((app) => (
            <AppTile key={app.labelKey} app={app} />
          ))}
        </div>
        <div className="mx-auto mt-[4.625rem] flex max-w-[930px] flex-col items-center justify-between gap-[1.375rem] font-bold text-nav min-[801px]:flex-row">
          <button
            className="flex cursor-pointer items-center gap-4 border-0 bg-transparent p-0 font-[inherit] text-[inherit]"
            type="button"
            onClick={() => setShowcase((open) => !open)}
            aria-pressed={showcase}
            aria-label={t("showcase.toggleAria")}
          >
            <span className={cn("landing-toggle", showcase && "is-on")}>
              <span className="landing-toggle-knob" />
            </span>
            <span>{t("showcase.toggleLabel")}</span>
          </button>
          <Link className="text-nav no-underline" to={TRIAL}>
            {t("showcase.viewAll")}{" "}
            <span className="ms-2 align-[-2px] text-[1.75rem]">→</span>
          </Link>
        </div>
        <div
          className="landing-showcase-copy mx-auto mt-[4.4375rem] max-w-[900px] text-center text-[1.375rem] leading-[1.6] max-[800px]:text-lg"
          id="features"
        >
          <h2 className="mb-0.5 text-[1.625rem] font-bold max-[800px]:text-[1.375rem]">
            {t("showcase.heading")}
          </h2>
          <p className="mb-[2.9375rem] max-[420px]:mb-[1.875rem]">
            {t("showcase.paragraph1a")}
            <br />
            {t("showcase.paragraph1b")}
          </p>
          <p className="mb-[2.9375rem] max-[420px]:mb-[1.875rem]">
            {t("showcase.paragraph2a")}
            <br />
            {t("showcase.paragraph2b")}
          </p>
        </div>
      </section>
    </main>
  );
}
