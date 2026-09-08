import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { uiI18nResources } from "@erp/ui";

// The shared components read their chrome strings through i18next; give
// the tests the same English resources the app boots with.
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
