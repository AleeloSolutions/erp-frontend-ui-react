import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  canInstall as checkCanInstall,
  canUninstall as checkCanUninstall,
  getInstalledModules,
  getModule,
  moduleCatalog,
  readInstalledIds,
  writeInstalledIds,
} from "./registry";
import {
  ModuleRegistryContext,
  type ModuleRegistryContextValue,
} from "./moduleRegistryContext";

export function ModuleRegistryProvider({ children }: { children: ReactNode }) {
  const [installedIds, setInstalledIds] = useState<string[]>(() => readInstalledIds());

  const installedModules = useMemo(
    () => getInstalledModules(installedIds),
    [installedIds]
  );

  const isInstalled = useCallback(
    (id: string) => installedIds.includes(id),
    [installedIds]
  );

  const install = useCallback(
    (id: string) => {
      const check = checkCanInstall(id, installedIds);
      if (!check.ok) {
        throw new Error(check.reason);
      }
      const next = [...installedIds, id];
      writeInstalledIds(next);
      setInstalledIds(next);
    },
    [installedIds]
  );

  const uninstall = useCallback(
    (id: string) => {
      const check = checkCanUninstall(id, installedIds);
      if (!check.ok) {
        throw new Error(check.reason);
      }
      const next = installedIds.filter((existing) => existing !== id);
      writeInstalledIds(next);
      setInstalledIds(next);
    },
    [installedIds]
  );

  const value = useMemo<ModuleRegistryContextValue>(
    () => ({
      catalog: moduleCatalog,
      installedIds,
      installedModules,
      isInstalled,
      install,
      uninstall,
      getModule,
      canInstall: (id) => checkCanInstall(id, installedIds),
      canUninstall: (id) => checkCanUninstall(id, installedIds),
    }),
    [installedIds, installedModules, isInstalled, install, uninstall]
  );

  return (
    <ModuleRegistryContext.Provider value={value}>
      {children}
    </ModuleRegistryContext.Provider>
  );
}
