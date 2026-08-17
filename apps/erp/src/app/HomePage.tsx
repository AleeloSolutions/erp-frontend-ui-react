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
            to="/inventory/products"
            className="inline-flex h-8 items-center justify-center rounded-[7px] border border-nav bg-nav px-3 text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(30,78,140,0.14)] hover:border-nav-active hover:bg-nav-active active:border-nav-active active:bg-nav-active"
          >
            Open Products module
          </Link>
        }
      />
      <div className="grid gap-3 min-[721px]:grid-cols-3">
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
            <CardTitle>Sales (mock)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[12px] text-erp-muted">
            <p className="m-0">
              Customers and quotations with Query mutations and feedback UI.
            </p>
            <Link
              to="/sales/customers"
              className="inline-flex font-bold text-erp-blue hover:underline"
            >
              Go to customers →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory (mock)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[12px] text-erp-muted">
            <p className="m-0">
              Products catalog with list, create, edit, delete, and stock levels.
            </p>
            <Link
              to="/inventory/products"
              className="inline-flex font-bold text-erp-blue hover:underline"
            >
              Go to products →
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
