import type { SettingsTabKey } from "./settingsTabs";

/** Drill-down views opened from overview action links. */
export type SettingsDetailView = "users-manage" | "company-edit";

export function detailViewTab(view: SettingsDetailView): SettingsTabKey {
  switch (view) {
    case "users-manage":
      return "users";
    case "company-edit":
      return "company";
  }
}

export const settingsOverviewStats = {
  activeUsers: 1,
  companies: 1,
} as const;
