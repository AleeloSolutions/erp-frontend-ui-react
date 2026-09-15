import { SettingsOverviewTile } from "./SettingsOverviewTile";
import { SettingsSection } from "./SettingsSection";

const INTEGRATIONS = [
  {
    key: "oauth",
    title: "OAuth Authentication",
    description: "Use external accounts to log in (Google, Facebook, etc.)",
  },
  {
    key: "ldap",
    title: "LDAP Authentication",
    description: "Use LDAP credentials to log in",
  },
] as const;

/** Integrations block for Company Info (and any other overview that embeds it). */
export function IntegrationsSettingsSection() {
  return (
    <SettingsSection title="Integrations">
      {INTEGRATIONS.map((item) => (
        <SettingsOverviewTile
          key={item.key}
          title={item.title}
          description={item.description}
        />
      ))}
    </SettingsSection>
  );
}
