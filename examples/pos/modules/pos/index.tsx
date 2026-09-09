/**
 * The POS module's bundle entry. Built with the module kit
 * (vite.config.ts) into `dist/module.js`, shipped in the package zip as
 * `frontend/module.js`, and loaded by the host SPA at runtime for every
 * tenant that has the module enabled.
 *
 * A bundle does exactly one thing on load: register its manifest — the
 * same shape a compiled-in module declares (`apps/erp/src/modules/types.ts`).
 * From then on the host's sidebar, route table and guards treat it like
 * one. Source lives under `modules/pos/` (sales-shaped); this file is the
 * kit entry that calls `registerModule`.
 */

import { registerModule } from "@kaabe/runtime";
import { posManifest } from "./manifest";
import "./styles.css";

registerModule(posManifest);
