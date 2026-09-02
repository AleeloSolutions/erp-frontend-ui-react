import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/lib/api-client";
import { signup } from "@/app/auth/api";
import {
  TrialGetStartedForm,
  type SignupFormValues,
} from "./components/TrialGetStartedForm";
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
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: SignupFormValues) => {
    setSubmitting(true);
    setServerErrors(null);
    setSubmitError(null);
    try {
      const result = await signup({
        full_name: values.full_name,
        company_name: values.company_name,
        slug: values.slug,
        email: values.email,
        // Backend expects strict E.164 (+252612345678)
        phone_number: values.phone.replace(/[\s\-().]/g, ""),
        country: values.country_id || "SO",
        language: LANGUAGE_MAP[values.lang] ?? "en",
        company_size: values.company_size,
        primary_interest: INTEREST_MAP[values.primary_interest] ?? "use_in_company",
        accept_terms: true, // clicking Start Now IS the acceptance (see agreement copy)
      });
      navigate(TRIAL_THANKS, {
        state: {
          tenantUrl: result.tenant_url,
          autoLoginToken: result.auto_login_token,
        },
      });
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setServerErrors(err.fields);
      } else {
        setSubmitError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again."
        );
      }
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
          serverErrors={serverErrors}
          submitError={submitError}
        />
      </main>
    </div>
  );
}
