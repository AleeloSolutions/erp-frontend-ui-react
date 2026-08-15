import { Route, Routes } from "react-router-dom";
import { Wallet } from "lucide-react";
import { AppShell, PageHeader } from "@/app";

function AccountingPlaceholderPage() {
  return (
    <AppShell activeNavKey="accounting" activeMobileKey="home">
      <PageHeader
        module="Accounting"
        section="Coming soon"
        title="Accounting"
        description="This module is installed but pages are not available yet."
        icon={<Wallet className="h-4 w-4" aria-hidden />}
      />
    </AppShell>
  );
}

/** Accounting module routes — mounted at `/accounting/*`. */
export function AccountingRoutes() {
  return (
    <Routes>
      <Route index element={<AccountingPlaceholderPage />} />
      <Route path="*" element={<AccountingPlaceholderPage />} />
    </Routes>
  );
}
