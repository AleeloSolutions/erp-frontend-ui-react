import { Route, Routes } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { AppShell, PageHeader } from "@/app";

function ProcurementPlaceholderPage() {
  return (
    <AppShell activeNavKey="procurement" activeMobileKey="home">
      <PageHeader
        module="Procurement"
        section="Coming soon"
        title="Procurement"
        description="This module is installed but pages are not available yet."
        icon={<ArrowLeftRight className="h-4 w-4" aria-hidden />}
      />
    </AppShell>
  );
}

/** Procurement module routes — mounted at `/procurement/*`. */
export function ProcurementRoutes() {
  return (
    <Routes>
      <Route index element={<ProcurementPlaceholderPage />} />
      <Route path="*" element={<ProcurementPlaceholderPage />} />
    </Routes>
  );
}
