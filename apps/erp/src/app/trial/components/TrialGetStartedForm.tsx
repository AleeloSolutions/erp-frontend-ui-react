import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@erp/ui";
import { DomainField } from "./DomainField";
import { TrialFloatingInput, TrialFloatingSelect } from "./TrialFloatingField";

export interface SignupFormValues {
  full_name: string;
  company_name: string;
  slug: string;
  email: string;
  phone: string;
  country_id: string;
  lang: string;
  company_size: string;
  primary_interest: string;
}

export interface TrialGetStartedFormProps {
  onSubmit: (values: SignupFormValues) => void;
  /** Disables Start Now while the workspace is being provisioned. */
  submitting?: boolean;
  /** Field errors from a rejected submit, e.g. {"slug": ["..."]}. */
  serverErrors?: Record<string, string[]> | null;
  /** A rejected submit with no field to attach to (network/server error). */
  submitError?: string | null;
}

/** <select> option value -> E.164 dial code, for the 6 countries this
 * form actually lists (no dial-code library exists in the project; a
 * bigger dataset would need one). */
const COUNTRY_DIAL_CODES: Record<string, string> = {
  SO: "+252",
  US: "+1",
  GB: "+44",
  AE: "+971",
  DE: "+49",
  FR: "+33",
};

// Mirrors the backend's phone_validator exactly (apps/users/models.py):
// "+" then 7-15 digits. A bare dial code (e.g. "+252", 3 digits) is
// already short enough to fail this on its own -- no extra check needed.
const PHONE_PATTERN = /^\+\d{7,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Local field id -> backend field name, for mapping a failed submit's
// {field: [message]} envelope onto the right inline error box.
const SERVER_FIELD_MAP: Record<string, string> = {
  "trial-name": "full_name",
  "trial-company": "company_name",
  "trial-domain": "slug",
  "trial-email": "email",
  "trial-phone": "phone_number",
};
const FIELD_ORDER = Object.keys(SERVER_FIELD_MAP);

export function TrialGetStartedForm({
  onSubmit,
  submitting = false,
  serverErrors = null,
  submitError = null,
}: TrialGetStartedFormProps) {
  const { t } = useTranslation("trial");

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugBlocked, setSlugBlocked] = useState(true);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+252");
  const previousCountry = useRef("SO");

  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors["trial-name"] = t("step2.errors.name");
    if (!companyName.trim()) errors["trial-company"] = t("step2.errors.companyName");
    if (!slug) errors["trial-domain"] = t("step2.errors.domainRequired");
    else if (slugBlocked) errors["trial-domain"] = t("step2.errors.domainTaken");
    if (!EMAIL_PATTERN.test(email)) errors["trial-email"] = t("step2.errors.email");
    if (!PHONE_PATTERN.test(phone.replace(/[\s\-().]/g, ""))) {
      errors["trial-phone"] = t("step2.errors.phone");
    }
    return errors;
  }

  function focusFirstError(errors: Record<string, string>) {
    const firstId = FIELD_ORDER.find((id) => errors[id]);
    if (!firstId) return;
    const el = document.getElementById(firstId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  }

  // Re-validate live once the user has attempted a submit, so a fixed
  // field's error clears as soon as it's fixed (not before the first attempt).
  useEffect(() => {
    if (!submitted) return;
    setFieldErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, name, companyName, slug, slugBlocked, email, phone]);

  // A rejected submit's server-side field errors render in the same
  // inline boxes and get the same scroll-to-first-error treatment.
  useEffect(() => {
    if (!serverErrors) return;
    const mapped: Record<string, string> = {};
    for (const [localId, backendField] of Object.entries(SERVER_FIELD_MAP)) {
      if (serverErrors[backendField]?.[0])
        mapped[localId] = serverErrors[backendField][0];
    }
    if (Object.keys(mapped).length === 0) return;
    setFieldErrors((prev) => ({ ...prev, ...mapped }));
    focusFirstError(mapped);
  }, [serverErrors]);

  function handleCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextCountry = event.target.value;
    const prevDialCode = COUNTRY_DIAL_CODES[previousCountry.current] ?? "";
    const nextDialCode = COUNTRY_DIAL_CODES[nextCountry] ?? "";
    setPhone((current) =>
      current.trim() === "" || current === prevDialCode ? nextDialCode : current
    );
    previousCountry.current = nextCountry;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    setSubmitted(true);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return;
    }
    const form = new FormData(event.currentTarget);
    onSubmit({
      full_name: name,
      company_name: companyName,
      slug,
      email,
      phone,
      country_id: String(form.get("country_id") ?? "SO"),
      lang: String(form.get("lang") ?? "en_US"),
      company_size: String(form.get("company_size") ?? "1-5"),
      primary_interest: String(form.get("primary_interest") ?? "plan_to_use"),
    });
  }

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
          <form className="trial-start-form" onSubmit={handleSubmit} noValidate>
            <div>
              <TrialFloatingInput
                id="trial-name"
                name="username"
                label={t("step2.name")}
                className="field-name"
                pattern={'[^\\x3C\\x3E\\"\\\\]+'}
                autoFocus
                required
                tabIndex={1}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {fieldErrors["trial-name"] ? (
                <p className="trial-field-error">{fieldErrors["trial-name"]}</p>
              ) : null}
            </div>

            <div>
              <TrialFloatingInput
                id="trial-company"
                name="company_name"
                label={t("step2.company")}
                className="field-company"
                required
                tabIndex={2}
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
              {fieldErrors["trial-company"] ? (
                <p className="trial-field-error">{fieldErrors["trial-company"]}</p>
              ) : null}
            </div>

            <DomainField
              companyName={companyName}
              onChange={(nextSlug, blocked) => {
                setSlug(nextSlug);
                setSlugBlocked(blocked);
              }}
              error={fieldErrors["trial-domain"]}
            />

            <div className="grid gap-0 lg:grid-cols-2 lg:gap-x-8">
              <div>
                <TrialFloatingInput
                  id="trial-email"
                  name="email"
                  type="email"
                  label={t("step2.email")}
                  className="field-email"
                  required
                  tabIndex={3}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {fieldErrors["trial-email"] ? (
                  <p className="trial-field-error">{fieldErrors["trial-email"]}</p>
                ) : null}
              </div>
              <div>
                <TrialFloatingInput
                  id="trial-phone"
                  name="phone"
                  type="tel"
                  label={t("step2.phone")}
                  className="field-phone"
                  required
                  tabIndex={4}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                {fieldErrors["trial-phone"] ? (
                  <p className="trial-field-error">{fieldErrors["trial-phone"]}</p>
                ) : null}
              </div>
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
                onChange={handleCountryChange}
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
                name="primary_interest"
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

            {submitError ? (
              <p role="alert" className="trial-field-error mb-4 text-center">
                {submitError}
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
