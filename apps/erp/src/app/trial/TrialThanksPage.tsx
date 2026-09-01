import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./trialThanks.css";

const DASHBOARD = "/dashboard";

type ThanksLocationState = {
  apps?: string[];
  /** From the signup response: where the provisioned workspace lives. */
  tenantUrl?: string;
  /** Single-use token that logs the owner straight into it. */
  autoLoginToken?: string;
};

type Phase = "idle" | "welcome" | "tagline" | "building" | "done";

const WELCOME_DELAY = 1000;
const WELCOME_DURATION = 4000;
const TAGLINE_DELAY = 300;
const TAGLINE_DURATION = 5000;
const BUILDING_DELAY = 300;
const TYPEWRITER_CHAR_MS = 85;
const REDIRECT_DELAY = 1200;

function useTypewriter(text: string, active: boolean) {
  const [value, setValue] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setValue("");
      setDone(false);
      return;
    }

    setValue("");
    setDone(false);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
        setDone(true);
      }
    }, TYPEWRITER_CHAR_MS);

    return () => window.clearInterval(timer);
  }, [active, text]);

  return { value, done };
}

export default function TrialThanksPage() {
  const { t } = useTranslation("trialThanks");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const showError = searchParams.get("error") === "1";

  const state = location.state as ThanksLocationState | null;

  const apps = useMemo(() => {
    if (state?.apps?.length) return state.apps;
    return [t("defaultApp")];
  }, [state, t]);

  const buildingLabel = apps[0] ?? t("defaultApp");

  const [phase, setPhase] = useState<Phase>("idle");
  const [pyroVisible, setPyroVisible] = useState(false);

  const { value: typedApp, done: typewriterDone } = useTypewriter(
    buildingLabel,
    phase === "building"
  );

  useEffect(() => {
    if (showError) return;

    const pyroTimer = window.setTimeout(() => setPyroVisible(true), 200);
    const welcomeTimer = window.setTimeout(() => setPhase("welcome"), WELCOME_DELAY);
    const taglineTimer = window.setTimeout(
      () => setPhase("tagline"),
      WELCOME_DELAY + WELCOME_DURATION + TAGLINE_DELAY
    );
    const buildingTimer = window.setTimeout(
      () => setPhase("building"),
      WELCOME_DELAY + WELCOME_DURATION + TAGLINE_DELAY + TAGLINE_DURATION + BUILDING_DELAY
    );

    return () => {
      window.clearTimeout(pyroTimer);
      window.clearTimeout(welcomeTimer);
      window.clearTimeout(taglineTimer);
      window.clearTimeout(buildingTimer);
    };
  }, [showError]);

  useEffect(() => {
    if (showError || phase !== "building" || !typewriterDone) return;

    const redirectTimer = window.setTimeout(() => {
      setPhase("done");
      if (state?.tenantUrl && state.autoLoginToken) {
        // Enter the freshly provisioned workspace on its own subdomain,
        // signed in via the single-use token from the signup response.
        window.location.replace(
          `${state.tenantUrl}/welcome?token=${encodeURIComponent(state.autoLoginToken)}`
        );
        return;
      }
      navigate(DASHBOARD, { replace: true });
    }, REDIRECT_DELAY);

    return () => window.clearTimeout(redirectTimer);
  }, [showError, phase, typewriterDone, navigate, state]);

  return (
    <div
      className={`trial-thanks-screen${
        phase === "building" || phase === "done" ? " is-building" : ""
      }`}
    >
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:start-0 focus:top-0 focus:z-[100] focus:bg-nav focus:px-4 focus:py-2 focus:text-erp-primary-foreground"
        href="#trial-thanks-main"
      >
        {t("skipToContent")}
      </a>

      {!showError ? (
        <>
          <div
            className={`trial-thanks-pyro${pyroVisible && phase !== "building" && phase !== "done" ? " is-visible" : ""}`}
            aria-hidden="true"
          />

          <div id="trial-thanks-main" className="trial-thanks-content">
            <div className="trial-thanks-messages">
              <h1
                className={`trial-thanks-message trial-thanks-welcome${
                  phase === "welcome" ? " is-active" : ""
                }`}
              >
                {t("welcome")}
              </h1>

              <h2
                className={`trial-thanks-message trial-thanks-tagline${
                  phase === "tagline" ? " is-active" : ""
                }`}
              >
                {t("taglineBefore")}
                <br className="hidden lg:inline" /> {t("taglineAfter")}
              </h2>

              <h3
                className={`trial-thanks-message trial-thanks-building${
                  phase === "building" || phase === "done" ? " is-active" : ""
                }`}
              >
                {t("building")}{" "}
                <span
                  className={`trial-thanks-typewriter${typewriterDone ? " is-done" : ""}`}
                >
                  {typedApp}
                </span>
              </h3>
            </div>
          </div>
        </>
      ) : (
        <div id="trial-thanks-main" className="trial-thanks-content">
          <div className="trial-thanks-error" role="alert">
            <h4>{t("errorTitle")}</h4>
            <p>
              {t("errorAccessBefore")}{" "}
              <a href={DASHBOARD} target="_blank" rel="noreferrer">
                {t("errorAccessLink")}
              </a>
              . {t("errorAccessAfter")} <Link to="/">{t("errorSupport")}</Link>{" "}
              {t("errorAccessEnd")}
            </p>
            <p>
              <span className="trial-thanks-error-detail">{t("errorDetail")}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
