import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@erp/ui";
import { TRIAL_APPS, TRIAL_CATEGORIES } from "./trialApps";
import { TrialAppCard, TrialSidebar } from "./components/TrialAppCard";
import { TrialGetStartedForm } from "./components/TrialGetStartedForm";
import "@/app/landing/landing.css";
import "./trial.css";

const DASHBOARD = "/dashboard";
const TRIAL_THANKS = "/thanks/trial";

const headerCta = cn(
  "inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-btn-hover",
  "bg-btn-hover px-4 py-2 text-[0.875rem] font-bold text-erp-primary-foreground shadow-sm",
  "transition-colors hover:bg-nav hover:border-nav"
);

const TRIAL_NAV = [
  { href: "/#apps", labelKey: "nav.apps" as const },
  { href: "/#industries", labelKey: "nav.industries" as const },
  { href: "/#community", labelKey: "nav.community" as const },
  { href: "/#pricing", labelKey: "nav.pricing" as const },
  { href: "#help", labelKey: "nav.help" as const },
];

export default function TrialPage() {
  const { t } = useTranslation("trial");
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedApps = useMemo(
    () => TRIAL_APPS.filter((app) => selected.has(app.id)),
    [selected]
  );

  const toggleApp = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeApp = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(TRIAL_THANKS, {
      state: {
        apps: selectedApps.map((app) => t(app.labelKey)),
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-erp-bg text-erp-text">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:start-0 focus:top-0 focus:z-[100] focus:bg-nav focus:px-4 focus:py-2 focus:text-erp-primary-foreground"
        href="#trial-main"
      >
        {t("skipToContent")}
      </a>

      <header className="sticky top-0 z-50 bg-erp-table-bg">
        <div className="mx-auto flex h-[4.875rem] max-w-[1230px] items-center justify-between gap-6 px-7">
          <Link
            className="text-[1.9375rem] font-bold leading-none tracking-[-0.1875rem] text-erp-subtle no-underline"
            to="/"
            aria-label={t("logoAria")}
          >
            <span className="text-nav">e</span>rp
          </Link>
          <nav
            className="hidden flex-1 justify-center gap-11 text-[0.9375rem] font-semibold min-[992px]:flex"
            aria-label="Main navigation"
          >
            {TRIAL_NAV.map((item) => (
              <Link
                key={item.labelKey}
                className="text-erp-text no-underline transition-colors hover:text-nav"
                to={item.href}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-[1.625rem] text-[0.9375rem] font-semibold">
            <Link
              className="text-erp-text no-underline transition-colors hover:text-nav"
              to={DASHBOARD}
            >
              {t("signIn")}
            </Link>
            <span className={headerCta} aria-current="page">
              {t("tryFree")}
            </span>
          </div>
        </div>
      </header>

      <main id="trial-main" className="flex flex-1 flex-col">
        {step === 1 ? (
          <section className="bg-erp-table-bg pt-4 text-center">
            <div className="mx-auto max-w-[960px] px-6 pb-8">
              <h1 className="trial-display-title mb-4">
                {t("step1.titleBefore")}{" "}
                <span className="trial-highlight">{t("step1.titleEmphasis")}</span>
              </h1>
              <p className="m-0 text-base text-erp-muted">{t("step1.subtitle")}</p>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section
            className={cn(
              "relative flex-1 bg-erp-bg",
              selected.size > 0 ? "pb-20 xl:pb-12" : "pb-12"
            )}
          >
            <div className="mx-auto w-full max-w-[1280px] px-6">
              <div className="flex justify-center gap-10">
                <div
                  className={cn(
                    "w-full max-w-[900px] py-8",
                    selected.size > 0 && "lg:ms-[8%]"
                  )}
                >
                  {TRIAL_CATEGORIES.map((category) => (
                    <div key={category.id} className="mb-8">
                      <h2 className="trial-category-title mb-3">
                        {t(category.labelKey)}
                      </h2>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {category.apps.map((app) => (
                          <TrialAppCard
                            key={app.id}
                            app={app}
                            selected={selected.has(app.id)}
                            onToggle={toggleApp}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {selected.size > 0 ? (
                  <aside className="hidden w-[min(100%,320px)] shrink-0 pt-8 xl:block xl:w-[300px]">
                    <div className="sticky top-24">
                      <TrialSidebar
                        selectedApps={selectedApps}
                        onRemove={removeApp}
                        onContinue={() => setStep(2)}
                      />
                    </div>
                  </aside>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <TrialGetStartedForm
            selectedApps={selectedApps}
            onChangeSelection={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}

        {step === 1 && selected.size > 0 ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-erp-border-soft bg-erp-table-bg p-4 shadow-lg xl:hidden">
            <TrialSidebar
              selectedApps={selectedApps}
              onRemove={removeApp}
              onContinue={() => setStep(2)}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
