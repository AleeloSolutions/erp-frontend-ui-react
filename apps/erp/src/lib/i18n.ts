import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { uiI18nResources } from "@erp/ui";

const resources = {
  en: {
    common: {
      ...uiI18nResources.en.common,
    },
    ui: {
      ...uiI18nResources.en.ui,
    },
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "ui"],
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
