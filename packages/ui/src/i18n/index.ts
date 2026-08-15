import { useTranslation, type UseTranslationOptions } from "react-i18next";
import type { UiNamespace } from "./resources";

/**
 * Translation helper for design-system chrome.
 * Requires the app (or Storybook) to initialize i18next with `uiI18nResources`.
 */
export function useUiTranslation(
  ns: UiNamespace = "ui",
  options?: UseTranslationOptions<UiNamespace>
) {
  return useTranslation(ns, options);
}

export { uiI18nResources } from "./resources";
export type { UiNamespace } from "./resources";
