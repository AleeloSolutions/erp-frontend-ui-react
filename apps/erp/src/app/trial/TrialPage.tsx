import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/lib/api-client";
import { signup } from "@/app/auth/api";
import { TrialGetStartedForm } from "./components/TrialGetStartedForm";
import "@/app/landing/landing.css";
import "./trial.css";

const SIGN_IN = "/login";
const TRIAL_THANKS = "/thanks/trial";

/** Form option values (Odoo-style) -> backend choice values. */
const LANGUAGE_MAP: Record<string, string> = {
  en_US: "en",
  ar_001: "ar",
  fr_FR: "fr",
};
const INTEREST_MAP: Record<string, string> = {
  plan_to_use: "use_in_company",
  plan_to_sell: "partner",
  plan_to_test_student: "student",
  plan_to_test_teacher: "teacher",
};

function fieldValue(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

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

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await signup({
        full_name: fieldValue(form, "username"),
        company_name: fieldValue(form, "company_name"),
        email: fieldValue(form, "email"),
        // Backend expects strict E.164 (+252612345678)
        phone_number: fieldValue(form, "phone").replace(/[\s\-().]/g, ""),
        country: fieldValue(form, "country_id") || "SO",
        language: LANGUAGE_MAP[fieldValue(form, "lang")] ?? "en",
        company_size: fieldValue(form, "company_size"),
        primary_interest: INTEREST_MAP[fieldValue(form, "plan")] ?? "use_in_company",
        accept_terms: true, // clicking Start Now IS the acceptance (see agreement copy)
      });
      navigate(TRIAL_THANKS, {
        state: {
          tenantUrl: result.tenant_url,
          autoLoginToken: result.auto_login_token,
        },
      });
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
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
              to={SIGN_IN}
            >
              {t("signIn")}
            </Link>
            <span
              className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-btn-hover bg-btn-hover px-4 py-2 text-[0.875rem] font-bold text-erp-primary-foreground shadow-sm transition-colors hover:bg-nav hover:border-nav"
              aria-current="page"
            >
              {t("tryFree")}
            </span>
          </div>
        </div>
      </header>

      <main id="trial-main" className="flex flex-1 flex-col">
        <TrialGetStartedForm
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
        />
      </main>
    </div>
  );
}
