import { Package } from "lucide-react";
import { AppShell, PageHeader } from "@/app";
import { inventorySubmenu } from "@/modules/inventory/manifest";

export default function StockMovementsPage() {
  return (
    <AppShell activeNavKey="inventory" activeMobileKey="tasks">
      <PageHeader
        module="Inventory"
        section="Stock movements"
        title="Stock movements"
        description="Stock in/out and adjustments will live here. Placeholder for now."
        icon={<Package className="h-4 w-4" aria-hidden />}
        submenu={{
          module: "Inventory",
          items: inventorySubmenu,
          activeKey: "movements",
        }}
      />
      <div className="rounded-[10px] border border-dashed border-erp-border bg-erp-surface p-6 text-[12px] text-erp-muted">
        No stock movement workflows yet. Use Products to manage catalog and on-hand
        quantities.
      </div>
    </AppShell>
  );
}
