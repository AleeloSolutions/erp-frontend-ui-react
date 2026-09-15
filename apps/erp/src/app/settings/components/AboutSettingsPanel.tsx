import { SettingsOverviewTile } from "./SettingsOverviewTile";
import { SettingsSection } from "./SettingsSection";

const APP_VERSION = "0.1.0";
const COPYRIGHT_YEAR = new Date().getFullYear();

/** About block for Company Info (and any other overview that embeds it). */
export function AboutSettingsSection() {
  return (
    <SettingsSection title="About">
      <SettingsOverviewTile
        className="col-span-full"
        title={`Kaabe ERP ${APP_VERSION}`}
        description={
          <>
            Copyright © {COPYRIGHT_YEAR}{" "}
            <a
              href="https://aleelosolutions.com"
              target="_blank"
              rel="noreferrer"
              className="text-erp-brand-third hover:underline"
            >
              Aleelo Solutions
            </a>
            .{" "}
            <a
              href="https://aleelosolutions.com"
              target="_blank"
              rel="noreferrer"
              className="text-erp-brand-third hover:underline"
            >
              Kaabe License
            </a>
            .
          </>
        }
      />
    </SettingsSection>
  );
}
