import { useSession } from "@/app/session";
import { Navigate, Route, Routes } from "react-router-dom";
import { itemRoutes } from "./items/routes";
import { categoryRoutes } from "./categories/routes";
import { movementRoutes } from "./movements/routes";
import { firstInventoryHref } from "./useInventoryNavbar";

function InventoryIndexRedirect() {
  const session = useSession();
  return <Navigate to={firstInventoryHref(session?.permissions ?? null)} replace />;
}

/**
 * Inventory module routes — mounted at `/inventory/*`.
 *
 * Each entity owns its own subtree, so adding one is a new folder and one
 * line here rather than an edit spread across the module.
 */
export function InventoryRoutes() {
  return (
    <Routes>
      <Route index element={<InventoryIndexRedirect />} />
      {itemRoutes}
      {categoryRoutes}
      {movementRoutes}
    </Routes>
  );
}
