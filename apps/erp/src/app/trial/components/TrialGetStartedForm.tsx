import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@erp/ui";
import { TrialFloatingInput, TrialFloatingSelect } from "./TrialFloatingField";

export interface TrialGetStartedFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** Disables Start Now while the workspace is being provisioned. */
  submitting?: boolean;
  /** Server-side rejection (email taken, invalid phone, ...). */
  error?: string | null;
}

export function TrialGetStartedForm({
  onSubmit,
  submitting = false,
  error = null,
}: TrialGetStartedFormProps) {
  const { t } = useTranslation("trial");

  return (
    <>
      <section className="bg-erp-table-bg pt-4 text-center">
        <div className="mx-auto max-w-[960px] px-6">
          <h1 className="trial-display-title mb-4">
            {t("step2.titleBefore")}{" "}
            <span className="trial-highlight trial-highlight-started">
              {t("step2.titleEmphasis")}
            </span>
          </h1>
          <p className="mb-8 text-base text-erp-muted">{t("step2.subtitle")}</p>
        </div>
      </section>

      <section className="trial-start-form-section flex-1 py-8">
        <div className="mx-auto max-w-[880px] px-6">
          <form className="trial-start-form" onSubmit={onSubmit} noValidate>
            <TrialFloatingInput
              id="trial-name"
              name="username"
              label={t("step2.name")}
              className="field-name"
              pattern={'[^\\x3C\\x3E\\"\\\\]+'}
              autoFocus
              tabIndex={1}
              required
            />

            <TrialFloatingInput
              id="trial-company"
              name="company_name"
              label={t("step2.company")}
              className="field-company"
              tabIndex={2}
              required
            />

            <div className="grid gap-0 lg:grid-cols-2 lg:gap-x-8">
              <TrialFloatingInput
                id="trial-email"
                name="email"
                type="email"
                label={t("step2.email")}
                className="field-email"
                tabIndex={3}
                required
              />
              <TrialFloatingInput
                id="trial-phone"
                name="phone"
                type="tel"
                label={t("step2.phone")}
                className="field-phone"
                defaultValue="+252"
                tabIndex={4}
                required
              />
            </div>

            <div className="grid gap-0 lg:grid-cols-2 lg:gap-x-8">
              <TrialFloatingSelect
                id="trial-country"
                name="country_id"
                label={t("step2.country")}
                className="field-country"
                tabIndex={5}
                required
                defaultValue="SO"
              >
                <option value="SO">{t("countries.SO")}</option>
                <option value="US">{t("countries.US")}</option>
                <option value="GB">{t("countries.GB")}</option>
                <option value="AE">{t("countries.AE")}</option>
                <option value="DE">{t("countries.DE")}</option>
                <option value="FR">{t("countries.FR")}</option>
              </TrialFloatingSelect>
              <TrialFloatingSelect
                id="trial-language"
                name="lang"
                label={t("step2.language")}
                className="field-languages"
                tabIndex={6}
                required
                defaultValue="en_US"
              >
                <option value="en_US">{t("languages.en")}</option>
                <option value="ar_001">{t("languages.ar")}</option>
                <option value="fr_FR">{t("languages.fr")}</option>
              </TrialFloatingSelect>
            </div>

            <div className="grid gap-0 lg:grid-cols-2 lg:gap-x-8">
              <TrialFloatingSelect
                id="trial-company-size"
                name="company_size"
                label={t("step2.companySize")}
                className="field-company-size"
                tabIndex={7}
                required
                defaultValue="1-5"
              >
                <option value="1-5">{t("companySizes.1-5")}</option>
                <option value="5-20">{t("companySizes.5-20")}</option>
                <option value="20-50">{t("companySizes.20-50")}</option>
                <option value="50-250">{t("companySizes.50-250")}</option>
                <option value="250-over">{t("companySizes.250-over")}</option>
              </TrialFloatingSelect>
              <TrialFloatingSelect
                id="trial-interest"
                name="plan"
                label={t("step2.primaryInterest")}
                className="field-primary-interest"
                tabIndex={8}
                required
                defaultValue="plan_to_use"
              >
                <option value="plan_to_use">{t("interests.use")}</option>
                <option value="plan_to_sell">{t("interests.partner")}</option>
                <option value="plan_to_test_student">{t("interests.student")}</option>
                <option value="plan_to_test_teacher">{t("interests.teacher")}</option>
              </TrialFloatingSelect>
            </div>

            <p
              className="trial-agreement mb-4 text-center text-sm text-erp-muted"
              role="alert"
            >
              {t("step2.agreementBefore")} <strong>{t("step2.startNow")}</strong>
              {t("step2.agreementMiddle")}{" "}
              <Link
                to="/terms"
                className="trial-agreement-link"
                target="_blank"
                rel="noreferrer"
              >
                {t("step2.termsLink")}
              </Link>{" "}
              {t("step2.agreementAnd")}{" "}
              <Link
                to="/privacy"
                className="trial-agreement-link"
                target="_blank"
                rel="noreferrer"
              >
                {t("step2.privacyLink")}
              </Link>
            </p>

            {error ? (
              <p
                role="alert"
                className="mb-4 text-center text-sm font-semibold text-erp-danger"
              >
                {error}
              </p>
            ) : null}

            <div className="text-center">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="px-8 py-3 text-base font-bold"
              >
                {t("step2.startNow")}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
