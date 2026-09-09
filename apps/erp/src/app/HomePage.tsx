import { Link, useNavigate } from "react-router-dom";
import { AppShell, useNavbarDefaults } from "@/app";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ControlPanel,
  PageActions,
} from "@erp/ui";
import { VerificationBanner } from "@/app/auth/VerificationBanner";

export default function HomePage() {
  const navigate = useNavigate();
  const navbar = useNavbarDefaults({ brandLabel: "Dashboard" });

  return (
    <AppShell activeNavKey="dashboard" activeMobileKey="home" navbar={navbar}>
      <VerificationBanner />
      <ControlPanel
        pageActions={
          <PageActions
            buttons={[
              {
                key: "quotations",
                children: "Open Quotations",
                variant: "primary",
                size: "sm",
                onClick: () => navigate("/sales/quotations"),
              },
            ]}
          />
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
