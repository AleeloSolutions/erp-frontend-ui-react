import "@testing-library/jest-dom/vitest";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { uiI18nResources } from "./src/i18n";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: uiI18nResources,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "ui",
    ns: ["common", "ui"],
    interpolation: { escapeValue: false },
  });
}
