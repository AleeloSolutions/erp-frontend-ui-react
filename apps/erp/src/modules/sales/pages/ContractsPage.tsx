import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell, PageHeader } from "@/app";
import { salesSubmenu } from "@/modules/sales/manifest";
import { Button } from "@erp/ui";

export default function ContractsPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks">
      <PageHeader
        module="Sales"
        section="Contracts"
        title="Contracts"
        description="Contracts module placeholder — compose with DataTable when ready."
        icon={<FileText className="h-4 w-4" aria-hidden />}
        submenu={{
          module: "Sales",
          items: salesSubmenu,
          activeKey: "contracts",
        }}
        actions={
          <Button variant="secondary" onClick={() => navigate("/sales/contracts/new")}>
            New Contract
          </Button>
        }
      />
    </AppShell>
  );
}
