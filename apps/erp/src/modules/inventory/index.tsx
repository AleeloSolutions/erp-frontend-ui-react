/**
 * Inventory module bundle entry. Built into dist/module.js and shipped as
 * frontend/module.js in the package zip.
 */

import { registerModule } from "@kaabe/runtime";
import { inventoryManifest } from "./manifest";
import "./styles.css";

registerModule(inventoryManifest);
