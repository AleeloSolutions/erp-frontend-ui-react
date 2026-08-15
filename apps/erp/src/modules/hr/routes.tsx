import { Route, Routes } from "react-router-dom";
import VendorsPage from "./pages/VendorsPage";

/** HR module routes — mounted at `/vendors/*`. */
export function VendorsRoutes() {
  return (
    <Routes>
      <Route index element={<VendorsPage />} />
    </Routes>
  );
}