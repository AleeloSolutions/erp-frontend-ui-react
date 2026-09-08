import type { SettingsTabKey } from "./settingsTabs";

/** Drill-down views opened from overview action links. */
export type SettingsDetailView =
  "users-manage" | "roles-manage" | "branches-manage" | "company-edit";

export function detailViewTab(view: SettingsDetailView): SettingsTabKey {
  switch (view) {
    case "users-manage":
    case "roles-manage":
    case "branches-manage":
      return "users";
    case "company-edit":
      return "company";
  }
}

export const settingsOverviewStats = {
  companies: 1,
} as const;
