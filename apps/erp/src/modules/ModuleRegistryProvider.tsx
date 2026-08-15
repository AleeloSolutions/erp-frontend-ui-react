import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ErpModule } from "./types";
import {
  canInstall as checkCanInstall,
  canUninstall as checkCanUninstall,
  getInstalledModules,
  getModule,
  moduleCatalog,
  readInstalledIds,
  writeInstalledIds,
} from "./registry";

export interface ModuleRegistryContextValue {
  catalog: ErpModule[];
  installedIds: string[];
  installedModules: ErpModule[];
  isInstalled: (id: string) => boolean;
  install: (id: string) => void;
  uninstall: (id: string) => void;
  getModule: typeof getModule;
  canInstall: (id: string) => ReturnType<typeof checkCanInstall>;
  canUninstall: (id: string) => ReturnType<typeof checkCanUninstall>;
}

const ModuleRegistryContext = createContext<ModuleRegistryContextValue | null>(
  null
);

export function ModuleRegistryProvider({ children }: { children: ReactNode }) {
  const [installedIds, setInstalledIds] = useState<string[]>(() =>
    readInstalledIds()
  );

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

export function useModuleRegistry(): ModuleRegistryContextValue {
  const ctx = useContext(ModuleRegistryContext);
  if (!ctx) {
    throw new Error(
      "useModuleRegistry must be used within ModuleRegistryProvider"
    );
  }
  return ctx;
}
