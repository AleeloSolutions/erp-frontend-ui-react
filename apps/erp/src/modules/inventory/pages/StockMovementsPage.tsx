import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ControlPanel, PageActions } from "@erp/ui";
import { AppShell, useNavbarDefaults } from "@/app";
import { inventoryNavbar, inventorySubmenu } from "@/modules/inventory/manifest";

export default function StockMovementsPage() {
  const location = useLocation();
  const activeBreadcrumb = useMemo(() => {
    for (const item of inventorySubmenu) {
      if (item.children) {
        const child = item.children.find((c) => location.pathname.startsWith(c.href));
        if (child) return child.label;
      }
    }
    return undefined;
  }, [location.pathname]);

  const navbar = useNavbarDefaults({
    ...inventoryNavbar,
    submenuActiveKey: "products",
  });

  return (
    <AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <ControlPanel pageActions={<PageActions breadcrumb={activeBreadcrumb} />} />
      <div className="rounded-[10px] border border-dashed border-erp-border bg-erp-surface p-6 text-[12px] text-erp-muted">
        No stock movement workflows yet. Use Products to manage catalog and on-hand
        quantities.
      </div>
    </AppShell>
  );
}
