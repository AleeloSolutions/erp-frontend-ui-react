/**
 * The POS module's public surface: what it is, and where it mounts.
 * Packaged modules also ship `index.tsx` as the Vite entry that calls
 * `registerModule(posManifest)`.
 */
export { posManifest as default, posManifest, posNavbar, posSubmenu } from "./manifest";
