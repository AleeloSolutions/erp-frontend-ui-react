import type { ReactElement, ReactNode } from "react";
import { CircleHelp, Users } from "lucide-react";
import { CompanyInfoForm } from "../CompanyInfoForm";
import { defaultCompanyInfo } from "../settingsCompany";
import type { SettingsTabKey } from "../settingsTabs";
import type { SettingsDetailView } from "../settingsViews";
import { settingsOverviewStats } from "../settingsViews";
import { SettingsDetailBack } from "./SettingsDetailBack";
import { SettingsOverviewLink } from "./SettingsOverviewLink";
import { SettingsOverviewTile } from "./SettingsOverviewTile";
import { SettingsSection } from "./SettingsSection";

export interface SettingsTabPanelProps {
  activeTab: SettingsTabKey;
  detailView: SettingsDetailView | null;
  onOpenDetail: (view: SettingsDetailView) => void;
  onOpenDocumentLayout: () => void;
  onBack: () => void;
}

function SettingsOverviewShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-sm border border-erp-border-soft bg-white"
      role="tabpanel"
    >
      {children}
    </div>
  );
}

function SettingsUsersOverview({
  onOpenDetail,
}: Pick<SettingsTabPanelProps, "onOpenDetail">) {
  return (
    <SettingsOverviewShell>
      <SettingsSection title="Users">
        <SettingsOverviewTile
          icon={<Users className="h-[18px] w-[18px]" aria-hidden />}
          title={
            <span className="inline-flex items-center gap-1.5">
              {settingsOverviewStats.activeUsers} Active User
              <CircleHelp
                className="h-3.5 w-3.5 text-erp-brand-third"
                aria-label="Counts users with access to this workspace"
              />
            </span>
          }
          action={
            <SettingsOverviewLink onClick={() => onOpenDetail("users-manage")}>
              Manage Users
            </SettingsOverviewLink>
          }
        />
      </SettingsSection>
    </SettingsOverviewShell>
  );
}

function SettingsUsersManagePanel({ onBack }: Pick<SettingsTabPanelProps, "onBack">) {
  return (
    <div role="tabpanel" aria-label="Manage Users">
      <SettingsDetailBack onBack={onBack} />
      <div className="rounded-sm border border-erp-border-soft bg-erp-table-bg px-6 py-10 text-center">
        <p className="m-0 text-sm text-erp-muted">User management — coming soon</p>
      </div>
    </div>
  );
}

function SettingsCompanyOverview({
  onOpenDetail,
  onOpenDocumentLayout,
}: Pick<SettingsTabPanelProps, "onOpenDetail" | "onOpenDocumentLayout">) {
  const { name, address, taxId } = defaultCompanyInfo;

  return (
    <SettingsOverviewShell>
      <SettingsSection title="Companies">
        <SettingsOverviewTile
          title={name}
          description={
            <>
              <div>{address}</div>
              <div>VAT: {taxId}</div>
            </>
          }
          action={
            <SettingsOverviewLink onClick={() => onOpenDetail("company-edit")}>
              Update Info
            </SettingsOverviewLink>
          }
        />
        <SettingsOverviewTile
          title={`${settingsOverviewStats.companies} Company`}
          action={
            <SettingsOverviewLink onClick={() => onOpenDetail("company-edit")}>
              Manage Companies
            </SettingsOverviewLink>
          }
        />
        <SettingsOverviewTile
          title="Document Layout"
          description="Choose the layout of your documents"
          action={
            <SettingsOverviewLink onClick={onOpenDocumentLayout}>
              Configure Document Layout
            </SettingsOverviewLink>
          }
        />
      </SettingsSection>
    </SettingsOverviewShell>
  );
}

function SettingsCompanyEditPanel({ onBack }: Pick<SettingsTabPanelProps, "onBack">) {
  return (
    <div role="tabpanel" aria-label="Company Info">
      <SettingsDetailBack onBack={onBack} />
      <CompanyInfoForm initialValues={defaultCompanyInfo} />
    </div>
  );
}

function SettingsDocumentOverview({
  onOpenDocumentLayout,
}: Pick<SettingsTabPanelProps, "onOpenDocumentLayout">) {
  return (
    <SettingsOverviewShell>
      <SettingsSection title="Document Layout">
        <SettingsOverviewTile
          title="Document Layout"
          description="Choose the layout of your documents"
          action={
            <SettingsOverviewLink onClick={onOpenDocumentLayout}>
              Configure Document Layout
            </SettingsOverviewLink>
          }
        />
      </SettingsSection>
    </SettingsOverviewShell>
  );
}

export function SettingsTabPanel({
  activeTab,
  detailView,
  onOpenDetail,
  onOpenDocumentLayout,
  onBack,
}: SettingsTabPanelProps) {
  if (detailView === "users-manage" && activeTab === "users") {
    return <SettingsUsersManagePanel onBack={onBack} />;
  }

  if (detailView === "company-edit" && activeTab === "company") {
    return <SettingsCompanyEditPanel onBack={onBack} />;
  }

  const overviews: Record<SettingsTabKey, () => ReactElement> = {
    users: () => <SettingsUsersOverview onOpenDetail={onOpenDetail} />,
    company: () => (
      <SettingsCompanyOverview
        onOpenDetail={onOpenDetail}
        onOpenDocumentLayout={onOpenDocumentLayout}
      />
    ),
    "document-layout": () => (
      <SettingsDocumentOverview onOpenDocumentLayout={onOpenDocumentLayout} />
    ),
  };

  const Overview = overviews[activeTab];
  return <Overview />;
}
