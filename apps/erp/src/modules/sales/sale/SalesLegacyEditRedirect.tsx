import { Navigate, useParams } from "react-router-dom";

/** Legacy `/sales/orders/:uuid/edit` → `/sales/:uuid/edit`. */
export function SalesLegacyEditRedirect() {
  const { uuid } = useParams<{ uuid: string }>();
  return <Navigate to={uuid ? `/sales/${uuid}/edit` : "/sales"} replace />;
}
