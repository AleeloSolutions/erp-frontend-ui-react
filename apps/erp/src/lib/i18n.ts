import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { uiI18nResources } from "@erp/ui";
import { landingEn } from "./i18n/landing.en";
import { trialEn } from "./i18n/trial.en";
import { trialThanksEn } from "./i18n/trialThanks.en";

const resources = {
  en: {
    common: {
      ...uiI18nResources.en.common,
    },
    ui: {
      ...uiI18nResources.en.ui,
    },
    landing: landingEn,
    trial: trialEn,
    trialThanks: trialThanksEn,
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "ui", "landing", "trial", "trialThanks"],
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
