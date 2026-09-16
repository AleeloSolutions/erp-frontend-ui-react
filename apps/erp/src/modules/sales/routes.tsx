import { Routes } from "react-router-dom";
import { customerRoutes } from "./customers/routes";
import { saleRoutes } from "./sale/routes";
import { productRoutes } from "./products/routes";

/**
 * Sales module routes — mounted at `/sales/*`.
 *
 * Index `/sales` is the Sales list. Customers and products are siblings.
 * Invoices and contracts remain in the repo but are not mounted.
 */
export function SalesRoutes() {
  return (
    <Routes>
      {saleRoutes}
      {customerRoutes}
      {productRoutes}
    </Routes>
  );
}
