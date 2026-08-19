import { createContext, useContext } from "react";
import type { ErpModule } from "./types";
import {
  canInstall as checkCanInstall,
  canUninstall as checkCanUninstall,
  getModule,
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

export const ModuleRegistryContext = createContext<ModuleRegistryContextValue | null>(
  null
);

export function useModuleRegistry(): ModuleRegistryContextValue {
  const ctx = useContext(ModuleRegistryContext);
  if (!ctx) {
    throw new Error("useModuleRegistry must be used within ModuleRegistryProvider");
  }
  return ctx;
}
