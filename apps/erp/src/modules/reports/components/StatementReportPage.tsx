import { FileBarChart } from "lucide-react";
import type { AccountReportNode } from "@erp/ui";
import { AccountReport, SideMenu } from "@erp/ui";
import { AppShell, PageHeader } from "@/app";
import { reportsManifest, reportsSubmenu } from "../manifest";

export type StatementReportPageProps = {
  /** Side-menu key and PageHeader section label. */
  navKey: string;
  section: string;
  description: string;
  /** Title rendered inside the report header cell (e.g. "BALANCE SHEET"). */
  reportTitle: string;
  nodes: AccountReportNode[];
  /** Gap before every level-0 section. Statements that place gaps explicitly leave this off. */
  spacerBetweenSections?: boolean;
};

/** Shared shell for the three statement reports — page chrome, side menu, report card. */
export function StatementReportPage({
  navKey,
  section,
  description,
  reportTitle,
  nodes,
  spacerBetweenSections = false,
}: StatementReportPageProps) {
  return (
    <AppShell activeNavKey="reports" activeMobileKey="reports">
      <PageHeader
        module={reportsManifest.label}
        section={section}
        title={section}
        description={description}
        icon={<FileBarChart className="h-4 w-4" aria-hidden />}
      />
      <div className="flex min-h-[540px] items-stretch">
        <SideMenu
          label={reportsManifest.label}
          items={reportsSubmenu}
          activeKey={navKey}
        />
        <div className="min-w-0 flex-1 overflow-x-auto p-4">
          {/* w-fit keeps the card hugging the report's fixed 768px width. */}
          {/* w-fit keeps the card hugging the report's fixed 768px width. */}
          <div className="w-fit rounded-sm border border-erp-report-row-border bg-white p-1">
            <AccountReport
              title={reportTitle}
              columns={[{ key: "balance", label: "Balance" }]}
              nodes={nodes}
              spacerBetweenSections={spacerBetweenSections}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
