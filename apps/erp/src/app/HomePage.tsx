import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { AppShell, PageHeader } from "@/app";
import { Card, CardContent, CardHeader, CardTitle } from "@erp/ui";

export default function HomePage() {
  return (
    <AppShell activeNavKey="dashboard" activeMobileKey="home">
      <PageHeader
        module="Platform"
        section="Home"
        title="ERP Component System"
        description="Reusable layout, tables, forms, Query, and feedback patterns for ERP modules."
        icon={<LayoutDashboard className="h-4 w-4" aria-hidden />}
        actions={
          <Link
            to="/sales/customers"
            className="inline-flex h-8 items-center justify-center rounded-[7px] border border-erp-blue bg-erp-blue px-3 text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(30,78,140,0.14)] hover:brightness-95"
          >
            Open Customers module
          </Link>
        }
      />
      <div className="grid gap-3 min-[721px]:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Component demos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[12px] text-erp-muted">
            <p className="m-0">
              Layout, UI, DataTable, Forms, Toast, Confirm, Drawer, and Query demos.
            </p>
            <Link
              to="/components-demo"
              className="inline-flex font-bold text-erp-blue hover:underline"
            >
              Go to components demo →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Composed module (mock)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[12px] text-erp-muted">
            <p className="m-0">
              Sales → Customers list + create page using Query mutations and feedback UI.
            </p>
            <Link
              to="/sales/customers"
              className="inline-flex font-bold text-erp-blue hover:underline"
            >
              Go to customers →
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
