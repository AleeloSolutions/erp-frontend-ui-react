export type { ErpModule } from "./types";
export {
  moduleCatalog,
  getModule,
  getModuleOrThrow,
  getInstalledModules,
  canInstall,
  canUninstall,
  getDependents,
  getMissingDependencies,
  DEFAULT_INSTALLED_MODULES,
} from "./registry";
export { ModuleRegistryProvider } from "./ModuleRegistryProvider";
export {
  useModuleRegistry,
  type ModuleRegistryContextValue,
} from "./moduleRegistryContext";
