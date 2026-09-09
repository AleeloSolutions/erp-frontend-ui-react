/**
 * The sales module's public surface: what it is, and where it mounts.
 *
 * Everything else — entity data layers, schemas, screens — is reached
 * through the entity folder that owns it, not from here. The routes are
 * deliberately not re-exported: the manifest loads them lazily so they
 * stay in their own chunk.
 */
export {
  salesManifest as default,
  salesManifest,
  salesNavbar,
  salesSubmenu,
} from "./manifest";
