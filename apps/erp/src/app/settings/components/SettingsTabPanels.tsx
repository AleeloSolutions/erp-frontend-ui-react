import type { ReactElement, ReactNode } from "react";
import { Building2, CircleHelp, ShieldCheck, Users } from "lucide-react";
import { SETTINGS_CODES, holdsAny } from "@/app/access";
import { useSession } from "@/app/session";
import { useCompanyInfo } from "../api";
import { useBranches } from "../branchesApi";
import { useRoles } from "../rolesApi";
import { useTenantUsers } from "../usersApi";
import { CompanyInfoForm } from "../CompanyInfoForm";
import { formatAddress, type CompanyInfo } from "../settingsCompany";
import type { SettingsTabKey } from "../settingsTabs";
import type { SettingsDetailView } from "../settingsViews";
import { settingsOverviewStats } from "../settingsViews";
import { SettingsDetailBack } from "./SettingsDetailBack";
import { SettingsOverviewLink } from "./SettingsOverviewLink";
import { SettingsOverviewTile } from "./SettingsOverviewTile";
import { SettingsBranchesPanel } from "./SettingsBranchesPanel";
import { SettingsModulesPanel } from "./SettingsModulesPanel";
import { SettingsRolesPanel } from "./SettingsRolesPanel";
import { SettingsSection } from "./SettingsSection";
import { LanguageSettingsForm } from "./LanguageSettingsForm";
import { SalesSettingsPanel } from "./SalesSettingsPanel";
import { SettingsUsersPanel } from "./SettingsUsersPanel";

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

/**
 * A count that admits it does not know yet.
 *
 * Rendering `0` while the request is still in flight states something
 * false — a workspace always has at least one branch and its system roles
 * — and then corrects itself, which reads as records appearing on their
 * own. A placeholder says "counting" instead of guessing.
 */
function CountLabel({
  loading,
  count,
  singular,
  plural,
}: {
  loading: boolean;
  count: number;
  singular: string;
  plural: string;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center" aria-busy="true">
        <span className="h-4 w-24 animate-pulse rounded bg-erp-border" aria-hidden />
        <span className="sr-only">Loading {plural.toLowerCase()}</span>
      </span>
    );
  }
  return (
    <>
      {count} {count === 1 ? singular : plural}
    </>
  );
}

function SettingsUsersOverview({
  onOpenDetail,
}: Pick<SettingsTabPanelProps, "onOpenDetail">) {
  const session = useSession();
  const codes = session?.permissions ?? null;
  const canUsers = holdsAny(codes, [...SETTINGS_CODES.users]);
  const canRoles = holdsAny(codes, [...SETTINGS_CODES.roles]);
  const canBranches = holdsAny(codes, [...SETTINGS_CODES.branches]);

  // One page of one row: we only need meta.total, not the users themselves.
  const { total, loading: usersLoading } = useTenantUsers({
    search: "",
    isActive: "true",
    ordering: "email",
    page: 1,
    pageSize: 1,
  });
  const { roles, loading: rolesLoading } = useRoles();
  const { branches, loading: branchesLoading } = useBranches();

  return (
    <SettingsOverviewShell>
      <SettingsSection title="Users">
        {canUsers ? (
          <SettingsOverviewTile
            icon={<Users className="h-[18px] w-[18px]" aria-hidden />}
            title={
              <span className="inline-flex items-center gap-1.5">
                <CountLabel
                  loading={usersLoading}
                  count={total}
                  singular="Active User"
                  plural="Active Users"
                />
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
        ) : null}
        {canRoles ? (
          <SettingsOverviewTile
            icon={<ShieldCheck className="h-[18px] w-[18px]" aria-hidden />}
            title={
              <CountLabel
                loading={rolesLoading}
                count={roles.length}
                singular="Role"
                plural="Roles"
              />
            }
            description="What each role may view, create, edit and delete"
            action={
              <SettingsOverviewLink onClick={() => onOpenDetail("roles-manage")}>
                Manage Roles
              </SettingsOverviewLink>
            }
          />
        ) : null}
        {canBranches ? (
          <SettingsOverviewTile
            icon={<Building2 className="h-[18px] w-[18px]" aria-hidden />}
            title={
              <CountLabel
                loading={branchesLoading}
                count={branches.length}
                singular="Branch"
                plural="Branches"
              />
            }
            description="Shops and offices, and who works at each"
            action={
              <SettingsOverviewLink onClick={() => onOpenDetail("branches-manage")}>
                Manage Branches
              </SettingsOverviewLink>
            }
          />
        ) : null}
      </SettingsSection>
    </SettingsOverviewShell>
  );
}

function SettingsCompanyOverview({
  info,
  onOpenDetail,
  onOpenDocumentLayout,
}: Pick<SettingsTabPanelProps, "onOpenDetail" | "onOpenDocumentLayout"> & {
  info: CompanyInfo;
}) {
  const session = useSession();
  const canDocumentLayout = holdsAny(session?.permissions ?? null, [
    ...SETTINGS_CODES.documentLayout,
  ]);
  const { name, taxNumber } = info;
  const address = formatAddress(info);

  return (
    <SettingsOverviewShell>
      <SettingsSection title="Companies">
        <SettingsOverviewTile
          title={name}
          description={
            address || taxNumber ? (
              <>
                {address ? <div>{address}</div> : null}
                {taxNumber ? <div>VAT: {taxNumber}</div> : null}
              </>
            ) : (
              <div className="text-erp-muted">No address or VAT number yet</div>
            )
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
        {canDocumentLayout ? (
          <SettingsOverviewTile
            title="Document Layout"
            description="Choose the layout of your documents"
            action={
              <SettingsOverviewLink onClick={onOpenDocumentLayout}>
                Configure Document Layout
              </SettingsOverviewLink>
            }
          />
        ) : null}
      </SettingsSection>
    </SettingsOverviewShell>
  );
}

function SettingsCompanyEditPanel({
  info,
  loaded,
  onSave,
  onBack,
}: Pick<SettingsTabPanelProps, "onBack"> & {
  info: CompanyInfo;
  loaded: boolean;
  onSave: (values: CompanyInfo) => Promise<void>;
}) {
  return (
    <div role="tabpanel" aria-label="Company Info">
      <SettingsDetailBack onBack={onBack} />
      {/* key: re-seed the form when the live values arrive */}
      <CompanyInfoForm
        key={loaded ? "live" : "demo"}
        initialValues={info}
        onSave={onSave}
      />
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
  const { info, loaded, save } = useCompanyInfo();

  if (detailView === "users-manage" && activeTab === "users") {
    return <SettingsUsersPanel onBack={onBack} />;
  }

  if (detailView === "roles-manage" && activeTab === "users") {
    return <SettingsRolesPanel onBack={onBack} />;
  }

  if (detailView === "branches-manage" && activeTab === "users") {
    return <SettingsBranchesPanel onBack={onBack} />;
  }

  if (detailView === "company-edit" && activeTab === "company") {
    return (
      <SettingsCompanyEditPanel
        info={info}
        loaded={loaded}
        onSave={save}
        onBack={onBack}
      />
    );
  }

  if (activeTab === "language") {
    return (
      <div role="tabpanel" aria-label="Language">
        <LanguageSettingsForm
          key={loaded ? "live" : "demo"}
          initialValues={info}
          onSave={save}
        />
      </div>
    );
  }

  if (activeTab === "sales") {
    return <SalesSettingsPanel />;
  }

  const overviews: Record<
    Exclude<SettingsTabKey, "language" | "sales">,
    () => ReactElement
  > = {
    users: () => <SettingsUsersOverview onOpenDetail={onOpenDetail} />,
    company: () => (
      <SettingsCompanyOverview
        info={info}
        onOpenDetail={onOpenDetail}
        onOpenDocumentLayout={onOpenDocumentLayout}
      />
    ),
    modules: () => <SettingsModulesPanel />,
    "document-layout": () => (
      <SettingsDocumentOverview onOpenDocumentLayout={onOpenDocumentLayout} />
    ),
  };

  const Overview = overviews[activeTab];
  return <Overview />;
}
