import commonEn from "./locales/en/common.json";
import uiEn from "./locales/en/ui.json";

/** Locale resources owned by `@erp/ui` (merge into the app i18n instance). */
export const uiI18nResources = {
  en: {
    common: commonEn,
    ui: uiEn,
  },
} as const;

export type UiNamespace = "common" | "ui";
