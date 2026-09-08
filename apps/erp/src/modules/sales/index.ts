/**
 * The sales module's public surface: what it is, and where it mounts.
 *
 * Everything else — entity data layers, schemas, screens — is reached
 * through the entity folder that owns it, not from here.
 */
export {
  salesManifest as default,
  salesManifest,
  salesNavbar,
  salesSubmenu,
} from "./manifest";
export { SalesRoutes } from "./routes";
