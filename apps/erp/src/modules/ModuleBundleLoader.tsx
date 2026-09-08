/**
 * Loads the packaged modules the session names, and keeps doing so as the
 * session changes -- after a platform install lights a module up for
 * this tenant, the next session refresh lists its bundle and it loads
 * without a page reload. Renders nothing.
 */

import { useEffect } from "react";
import { useSession } from "@/app/session";
import { loadModuleBundles } from "./loader";

export function ModuleBundleLoader() {
  const session = useSession();
  const bundles = session?.module_bundles;

  useEffect(() => {
    if (bundles && bundles.length > 0) void loadModuleBundles(bundles);
  }, [bundles]);

  return null;
}
