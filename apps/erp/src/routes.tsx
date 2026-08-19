import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/app/HomePage";
import ComponentsDemoPage from "@/app/components-demo/ComponentsDemoPage";
import AppsPage from "@/app/AppsPage";
import { useModuleRegistry } from "@/modules";

/**
 * App-level route table.
 * Feature routes come from installed module manifests.
 */
export function AppRoutes() {
  const { installedModules } = useModuleRegistry();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/apps" element={<AppsPage />} />
      <Route path="/components-demo" element={<ComponentsDemoPage />} />
      {installedModules.map((mod) => {
        const ModuleRoutes = mod.Routes;
        const path = `${mod.path.replace(/\/$/, "")}/*`;
        return <Route key={mod.id} path={path} element={<ModuleRoutes />} />;
      })}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
