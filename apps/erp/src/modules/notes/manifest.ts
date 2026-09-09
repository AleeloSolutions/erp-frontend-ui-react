import { lazy } from "react";
import { StickyNote } from "lucide-react";
import type { ModuleManifest } from "../types";

export const notesSubmenu = [{ key: "all", label: "All notes", href: "/notes" }];

export const notesNavbar = {
  brandLabel: "Notes",
  submenuItems: notesSubmenu,
};

export const notesManifest: ModuleManifest = {
  key: "notes",
  navArea: "operations",
  id: "notes",
  label: "Notes",
  version: "1.0.0",
  description: "Short workspace memos.",
  icon: StickyNote,
  path: "/notes",
  nav: {
    key: "notes",
    label: "Notes",
    icon: StickyNote,
    href: "/notes",
    children: notesSubmenu,
  },
  submenu: notesSubmenu,
  resources: ["notes.note"],
  Routes: lazy(() =>
    import("./routes").then((module) => ({ default: module.NotesRoutes }))
  ),
};

export default notesManifest;
